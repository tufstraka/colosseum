// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IXcm.sol";

/**
 * @title VaultstoneInvoice
 * @author Vaultstone Team
 * @notice NFT-based invoice system for Polkadot Hub with XCM cross-chain payments
 * @dev Implements ERC721 with invoice-specific functionality and XCM integration
 */
contract VaultstoneInvoice is ERC721URIStorage, ERC721Enumerable, AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant XCM_EXECUTOR_ROLE = keccak256("XCM_EXECUTOR_ROLE");

    uint256 public constant MAX_SPLITS = 10;
    uint256 public constant BASIS_POINTS = 10_000;
    uint256 public constant MAX_PLATFORM_FEE = 500;

    // XCM Precompile
    IXcm public constant xcm = IXcm(XCM_PRECOMPILE_ADDRESS);

    enum InvoiceStatus {
        Pending,
        Paid,
        Cancelled,
        Overdue,
        Disputed
    }

    struct PaymentSplit {
        address payee;
        uint256 shares;
    }

    struct Invoice {
        uint256 id;
        address creator;
        address recipient;
        uint256 amount;
        address currency;
        uint256 dueDate;
        uint256 createdAt;
        uint256 paidAt;
        InvoiceStatus status;
        PaymentSplit[] splits;
    }
    
    // Cross-chain payment tracking
    struct CrossChainPayment {
        uint32 sourceParachain;
        bytes32 xcmMessageId;
        uint256 amount;
        uint256 timestamp;
        bool completed;
    }

    uint256 private _nextTokenId;
    uint256 public platformFee;
    address public platformFeeRecipient;

    mapping(uint256 => Invoice) private _invoices;
    mapping(address => uint256[]) private _creatorInvoices;
    mapping(address => uint256[]) private _recipientInvoices;
    
    // Cross-chain state
    mapping(uint256 => CrossChainPayment) public crossChainPayments;
    mapping(uint32 => bytes) public parachainLocations;
    mapping(uint32 => bool) public supportedParachains;

    event InvoiceCreated(
        uint256 indexed invoiceId,
        address indexed creator,
        address indexed recipient,
        uint256 amount,
        address currency,
        uint256 dueDate
    );

    event InvoicePaid(uint256 indexed invoiceId, address indexed payer, uint256 amount, uint256 paidAt);
    event InvoiceCancelled(uint256 indexed invoiceId, address indexed canceller);
    event InvoiceDisputed(uint256 indexed invoiceId, address indexed disputer, string reason);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event PlatformFeeRecipientUpdated(address oldRecipient, address newRecipient);
    
    // Cross-chain events
    event CrossChainPaymentInitiated(
        uint256 indexed invoiceId,
        uint32 indexed sourceParachain,
        address indexed payer,
        uint256 amount,
        bytes32 xcmMessageId
    );
    
    event CrossChainPaymentReceived(
        uint256 indexed invoiceId,
        uint32 indexed sourceParachain,
        uint256 amount
    );
    
    event ParachainRegistered(uint32 indexed parachainId, bytes location);
    
    event XCMPaymentRequestSent(
        uint256 indexed invoiceId,
        uint32 indexed targetParachain
    );

    error InvalidRecipient();
    error InvalidAmount();
    error InvalidDueDate();
    error InvalidSplits();
    error SplitsTotalInvalid();
    error TooManySplits();
    error InvoiceNotFound();
    error InvoiceNotPending();
    error InvoiceAlreadyPaid();
    error InvoiceExpired();
    error InsufficientPayment();
    error NotInvoiceCreator();
    error NotInvoiceRecipient();
    error TransferFailed();
    error InvalidPlatformFee();
    error InvalidFeeRecipient();
    error ParachainNotSupported();
    error XCMExecutionFailed();

    constructor(
        string memory name,
        string memory symbol,
        address admin,
        address feeRecipient,
        uint256 initialFee
    ) ERC721(name, symbol) {
        if (admin == address(0)) revert InvalidRecipient();
        if (feeRecipient == address(0)) revert InvalidFeeRecipient();
        if (initialFee > MAX_PLATFORM_FEE) revert InvalidPlatformFee();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(XCM_EXECUTOR_ROLE, admin);

        platformFeeRecipient = feeRecipient;
        platformFee = initialFee;
        _nextTokenId = 1;
        
        // Register common Polkadot parachains
        _registerDefaultParachains();
    }

    // ============ Invoice Creation ============

    function createInvoice(
        address recipient,
        uint256 amount,
        address currency,
        uint256 dueDate,
        string calldata metadataURI,
        PaymentSplit[] calldata splits
    ) external whenNotPaused returns (uint256 invoiceId) {
        if (recipient == address(0)) revert InvalidRecipient();
        if (amount == 0) revert InvalidAmount();
        if (dueDate <= block.timestamp) revert InvalidDueDate();
        if (splits.length > MAX_SPLITS) revert TooManySplits();

        uint256 totalShares;
        for (uint256 i = 0; i < splits.length; i++) {
            if (splits[i].payee == address(0)) revert InvalidSplits();
            if (splits[i].shares == 0) revert InvalidSplits();
            totalShares += splits[i].shares;
        }
        if (splits.length > 0 && totalShares != BASIS_POINTS) revert SplitsTotalInvalid();

        invoiceId = _nextTokenId++;

        Invoice storage invoice = _invoices[invoiceId];
        invoice.id = invoiceId;
        invoice.creator = msg.sender;
        invoice.recipient = recipient;
        invoice.amount = amount;
        invoice.currency = currency;
        invoice.dueDate = dueDate;
        invoice.createdAt = block.timestamp;
        invoice.status = InvoiceStatus.Pending;

        for (uint256 i = 0; i < splits.length; i++) {
            invoice.splits.push(splits[i]);
        }

        if (splits.length == 0) {
            invoice.splits.push(PaymentSplit({ payee: msg.sender, shares: BASIS_POINTS }));
        }

        _creatorInvoices[msg.sender].push(invoiceId);
        _recipientInvoices[recipient].push(invoiceId);

        _safeMint(msg.sender, invoiceId);
        _setTokenURI(invoiceId, metadataURI);

        emit InvoiceCreated(invoiceId, msg.sender, recipient, amount, currency, dueDate);
    }

    // ============ Same-Chain Payment ============

    function payInvoice(uint256 invoiceId) external payable nonReentrant whenNotPaused {
        Invoice storage invoice = _invoices[invoiceId];

        if (invoice.id == 0) revert InvoiceNotFound();
        if (invoice.status != InvoiceStatus.Pending) revert InvoiceNotPending();
        if (invoice.currency != address(0)) revert InsufficientPayment();

        uint256 totalAmount = invoice.amount;
        uint256 feeAmount = (totalAmount * platformFee) / BASIS_POINTS;
        uint256 paymentAmount = totalAmount + feeAmount;

        if (msg.value < paymentAmount) revert InsufficientPayment();

        invoice.status = InvoiceStatus.Paid;
        invoice.paidAt = block.timestamp;

        _distributeNativePayment(invoice, totalAmount, feeAmount);

        if (msg.value > paymentAmount) {
            (bool refundSuccess,) = msg.sender.call{ value: msg.value - paymentAmount }("");
            if (!refundSuccess) revert TransferFailed();
        }

        emit InvoicePaid(invoiceId, msg.sender, totalAmount, block.timestamp);
    }

    function payInvoiceWithToken(uint256 invoiceId) external nonReentrant whenNotPaused {
        Invoice storage invoice = _invoices[invoiceId];

        if (invoice.id == 0) revert InvoiceNotFound();
        if (invoice.status != InvoiceStatus.Pending) revert InvoiceNotPending();
        if (invoice.currency == address(0)) revert InsufficientPayment();

        uint256 totalAmount = invoice.amount;
        uint256 feeAmount = (totalAmount * platformFee) / BASIS_POINTS;
        uint256 paymentAmount = totalAmount + feeAmount;

        IERC20 token = IERC20(invoice.currency);

        invoice.status = InvoiceStatus.Paid;
        invoice.paidAt = block.timestamp;

        token.safeTransferFrom(msg.sender, address(this), paymentAmount);
        _distributeTokenPayment(invoice, token, totalAmount, feeAmount);

        emit InvoicePaid(invoiceId, msg.sender, totalAmount, block.timestamp);
    }

    // ============ XCM Cross-Chain Payment ============
    
    /**
     * @notice Register a parachain for cross-chain payments
     * @param parachainId The parachain ID (e.g., 1000 for Asset Hub, 2000 for Astar)
     * @param locationEncoded SCALE-encoded MultiLocation for the parachain
     */
    function registerParachain(
        uint32 parachainId,
        bytes calldata locationEncoded
    ) external onlyRole(ADMIN_ROLE) {
        parachainLocations[parachainId] = locationEncoded;
        supportedParachains[parachainId] = true;
        emit ParachainRegistered(parachainId, locationEncoded);
    }
    
    /**
     * @notice Initiate a cross-chain payment from another parachain
     * @dev Uses XCM to send payment request to source parachain
     * @param invoiceId Invoice to pay
     * @param sourceParachain Parachain ID where payer's funds are located
     */
    function initiateCrossChainPayment(
        uint256 invoiceId,
        uint32 sourceParachain
    ) external whenNotPaused {
        Invoice storage invoice = _invoices[invoiceId];
        
        if (invoice.id == 0) revert InvoiceNotFound();
        if (invoice.status != InvoiceStatus.Pending) revert InvoiceNotPending();
        if (!supportedParachains[sourceParachain]) revert ParachainNotSupported();
        
        bytes memory destination = parachainLocations[sourceParachain];
        
        // Build XCM message to request payment from source parachain
        bytes memory xcmMessage = _buildCrossChainPaymentRequest(
            invoiceId,
            msg.sender,
            invoice.amount
        );
        
        // Send XCM message
        xcm.send(destination, xcmMessage);
        
        // Record pending cross-chain payment
        bytes32 messageId = keccak256(abi.encodePacked(invoiceId, sourceParachain, block.timestamp));
        crossChainPayments[invoiceId] = CrossChainPayment({
            sourceParachain: sourceParachain,
            xcmMessageId: messageId,
            amount: invoice.amount,
            timestamp: block.timestamp,
            completed: false
        });
        
        emit CrossChainPaymentInitiated(invoiceId, sourceParachain, msg.sender, invoice.amount, messageId);
        emit XCMPaymentRequestSent(invoiceId, sourceParachain);
    }
    
    /**
     * @notice Receive cross-chain payment confirmation
     * @dev Called by XCM executor when payment is received from another chain
     * @param invoiceId Invoice being paid
     * @param sourceParachain Source parachain of payment
     * @param amount Amount received
     */
    function receiveCrossChainPayment(
        uint256 invoiceId,
        uint32 sourceParachain,
        uint256 amount
    ) external payable onlyRole(XCM_EXECUTOR_ROLE) nonReentrant {
        Invoice storage invoice = _invoices[invoiceId];
        
        if (invoice.id == 0) revert InvoiceNotFound();
        if (invoice.status != InvoiceStatus.Pending) revert InvoiceNotPending();
        
        uint256 totalAmount = invoice.amount;
        uint256 feeAmount = (totalAmount * platformFee) / BASIS_POINTS;
        
        if (amount < totalAmount + feeAmount) revert InsufficientPayment();
        
        // Mark as paid
        invoice.status = InvoiceStatus.Paid;
        invoice.paidAt = block.timestamp;
        
        // Update cross-chain payment record
        crossChainPayments[invoiceId].completed = true;
        
        // Distribute payment
        _distributeNativePayment(invoice, totalAmount, feeAmount);
        
        emit CrossChainPaymentReceived(invoiceId, sourceParachain, amount);
        emit InvoicePaid(invoiceId, address(this), totalAmount, block.timestamp);
    }
    
    /**
     * @notice Execute XCM for cross-chain asset transfer
     * @param invoiceId Invoice being paid
     * @param xcmMessage Pre-built XCM message
     */
    function executeXCMPayment(
        uint256 invoiceId,
        bytes calldata xcmMessage
    ) external payable nonReentrant whenNotPaused {
        Invoice storage invoice = _invoices[invoiceId];
        
        if (invoice.id == 0) revert InvoiceNotFound();
        if (invoice.status != InvoiceStatus.Pending) revert InvoiceNotPending();
        
        // Get required weight for XCM execution
        IXcm.Weight memory weight = xcm.weighMessage(xcmMessage);
        
        // Add 20% buffer
        weight.refTime = weight.refTime * 120 / 100;
        weight.proofSize = weight.proofSize * 120 / 100;
        
        // Execute the XCM
        xcm.execute(xcmMessage, weight);
        
        // Note: Actual payment completion will be handled by receiveCrossChainPayment
        // when the XCM message is processed and funds arrive
    }
    
    /**
     * @notice Get supported parachains for cross-chain payments
     * @return parachainIds Array of supported parachain IDs
     */
    function getSupportedParachains() external view returns (uint32[] memory parachainIds) {
        // Return common Polkadot parachains
        parachainIds = new uint32[](5);
        parachainIds[0] = 1000; // Asset Hub
        parachainIds[1] = 2000; // Acala
        parachainIds[2] = 2004; // Moonbeam
        parachainIds[3] = 2006; // Astar
        parachainIds[4] = 2030; // Bifrost
    }

    // ============ Invoice Management ============

    function cancelInvoice(uint256 invoiceId) external whenNotPaused {
        Invoice storage invoice = _invoices[invoiceId];

        if (invoice.id == 0) revert InvoiceNotFound();
        if (invoice.creator != msg.sender) revert NotInvoiceCreator();
        if (invoice.status != InvoiceStatus.Pending) revert InvoiceNotPending();

        invoice.status = InvoiceStatus.Cancelled;
        emit InvoiceCancelled(invoiceId, msg.sender);
    }

    function disputeInvoice(uint256 invoiceId, string calldata reason) external whenNotPaused {
        Invoice storage invoice = _invoices[invoiceId];

        if (invoice.id == 0) revert InvoiceNotFound();
        if (invoice.recipient != msg.sender && invoice.creator != msg.sender) {
            revert NotInvoiceRecipient();
        }
        if (invoice.status != InvoiceStatus.Pending) revert InvoiceNotPending();

        invoice.status = InvoiceStatus.Disputed;
        emit InvoiceDisputed(invoiceId, msg.sender, reason);
    }

    // ============ View Functions ============

    function getInvoice(uint256 invoiceId) external view returns (Invoice memory) {
        if (_invoices[invoiceId].id == 0) revert InvoiceNotFound();
        return _invoices[invoiceId];
    }

    function getInvoicesByCreator(address creator) external view returns (uint256[] memory) {
        return _creatorInvoices[creator];
    }

    function getInvoicesByRecipient(address recipient) external view returns (uint256[] memory) {
        return _recipientInvoices[recipient];
    }

    function isOverdue(uint256 invoiceId) external view returns (bool) {
        Invoice storage invoice = _invoices[invoiceId];
        return invoice.status == InvoiceStatus.Pending && block.timestamp > invoice.dueDate;
    }

    function calculatePaymentAmount(uint256 invoiceId) external view returns (uint256 total, uint256 fee) {
        Invoice storage invoice = _invoices[invoiceId];
        if (invoice.id == 0) revert InvoiceNotFound();

        fee = (invoice.amount * platformFee) / BASIS_POINTS;
        total = invoice.amount + fee;
    }
    
    function getCrossChainPaymentStatus(uint256 invoiceId) external view returns (CrossChainPayment memory) {
        return crossChainPayments[invoiceId];
    }

    // ============ Admin Functions ============

    function setPlatformFee(uint256 newFee) external onlyRole(ADMIN_ROLE) {
        if (newFee > MAX_PLATFORM_FEE) revert InvalidPlatformFee();

        uint256 oldFee = platformFee;
        platformFee = newFee;
        emit PlatformFeeUpdated(oldFee, newFee);
    }

    function setPlatformFeeRecipient(address newRecipient) external onlyRole(ADMIN_ROLE) {
        if (newRecipient == address(0)) revert InvalidFeeRecipient();

        address oldRecipient = platformFeeRecipient;
        platformFeeRecipient = newRecipient;
        emit PlatformFeeRecipientUpdated(oldRecipient, newRecipient);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ============ Internal Functions ============
    
    function _registerDefaultParachains() internal {
        // Asset Hub (Statemint)
        supportedParachains[1000] = true;
        // Acala
        supportedParachains[2000] = true;
        // Moonbeam
        supportedParachains[2004] = true;
        // Astar  
        supportedParachains[2006] = true;
        // Bifrost
        supportedParachains[2030] = true;
        // Hydration
        supportedParachains[2034] = true;
    }
    
    function _buildCrossChainPaymentRequest(
        uint256 invoiceId,
        address payer,
        uint256 amount
    ) internal view returns (bytes memory) {
        // Build XCM V4 message for cross-chain payment
        // This is a simplified version - production would need proper SCALE encoding
        
        // The XCM program will:
        // 1. WithdrawAsset from payer on source chain
        // 2. InitiateReserveWithdraw to Hub
        // 3. BuyExecution on Hub
        // 4. DepositAsset to this contract
        // 5. Transact to call receiveCrossChainPayment
        
        return abi.encodePacked(
            uint8(0x05), // XCM V4 prefix
            _encodeWithdrawAsset(amount),
            _encodeInitiateReserveWithdraw(amount),
            _encodeBuyExecution(amount / 10),
            _encodeDepositReserveAsset(address(this)),
            _encodeTransact(invoiceId, payer, amount)
        );
    }
    
    function _encodeWithdrawAsset(uint256 amount) internal pure returns (bytes memory) {
        return abi.encodePacked(
            uint8(0x00), // WithdrawAsset
            uint8(0x01), // 1 asset
            uint8(0x00), // Native (DOT)
            _encodeCompact(amount)
        );
    }
    
    function _encodeInitiateReserveWithdraw(uint256 amount) internal pure returns (bytes memory) {
        return abi.encodePacked(
            uint8(0x09), // InitiateReserveWithdraw
            uint8(0x01), // 1 asset
            uint8(0x00), // Native
            _encodeCompact(amount),
            uint8(0x01), // Parent (relay chain)
            uint8(0x00)  // Parachain 0 (Hub)
        );
    }
    
    function _encodeBuyExecution(uint256 feeAmount) internal pure returns (bytes memory) {
        return abi.encodePacked(
            uint8(0x13), // BuyExecution
            uint8(0x00), // Native asset
            _encodeCompact(feeAmount),
            uint8(0x00)  // Unlimited weight
        );
    }
    
    function _encodeDepositReserveAsset(address recipient) internal pure returns (bytes memory) {
        return abi.encodePacked(
            uint8(0x0A), // DepositReserveAsset
            uint8(0x01), // Wildcard assets
            uint8(0x01), // 1 beneficiary
            uint8(0x01), // AccountKey20
            bytes20(recipient)
        );
    }
    
    function _encodeTransact(
        uint256 invoiceId,
        address payer,
        uint256 amount
    ) internal pure returns (bytes memory) {
        // Encode call to receiveCrossChainPayment
        bytes memory call = abi.encodeWithSignature(
            "receiveCrossChainPayment(uint256,uint32,uint256)",
            invoiceId,
            uint32(0), // Will be set by XCM executor
            amount
        );
        
        return abi.encodePacked(
            uint8(0x06), // Transact
            uint8(0x02), // SovereignAccount origin
            _encodeCompact(1000000), // require weight
            _encodeCompact(call.length),
            call
        );
    }
    
    function _encodeCompact(uint256 value) internal pure returns (bytes memory) {
        if (value < 0x40) {
            return abi.encodePacked(uint8(value << 2));
        } else if (value < 0x4000) {
            return abi.encodePacked(uint16((value << 2) | 0x01));
        } else if (value < 0x40000000) {
            return abi.encodePacked(uint32((value << 2) | 0x02));
        } else {
            return abi.encodePacked(uint8(0x03 | (16 << 2)), uint128(value));
        }
    }

    function _distributeNativePayment(Invoice storage invoice, uint256 totalAmount, uint256 feeAmount) internal {
        if (feeAmount > 0) {
            (bool feeSuccess,) = platformFeeRecipient.call{ value: feeAmount }("");
            if (!feeSuccess) revert TransferFailed();
        }

        for (uint256 i = 0; i < invoice.splits.length; i++) {
            uint256 splitAmount = (totalAmount * invoice.splits[i].shares) / BASIS_POINTS;
            if (splitAmount > 0) {
                (bool success,) = invoice.splits[i].payee.call{ value: splitAmount }("");
                if (!success) revert TransferFailed();
            }
        }
    }

    function _distributeTokenPayment(
        Invoice storage invoice,
        IERC20 token,
        uint256 totalAmount,
        uint256 feeAmount
    ) internal {
        if (feeAmount > 0) {
            token.safeTransfer(platformFeeRecipient, feeAmount);
        }

        for (uint256 i = 0; i < invoice.splits.length; i++) {
            uint256 splitAmount = (totalAmount * invoice.splits[i].shares) / BASIS_POINTS;
            if (splitAmount > 0) {
                token.safeTransfer(invoice.splits[i].payee, splitAmount);
            }
        }
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721URIStorage, ERC721Enumerable, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    // Allow contract to receive native tokens for cross-chain payments
    receive() external payable {}
}
