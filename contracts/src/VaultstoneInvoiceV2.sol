// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title VaultstoneInvoiceV2
 * @notice Fixed version that avoids MetaMask burn address warning
 * @dev Uses sentinel address 0x000...001 instead of 0x000...000 for native currency
 */
contract VaultstoneInvoiceV2 is ERC721URIStorage, ERC721Enumerable, AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public constant MAX_SPLITS = 10;
    uint256 public constant BASIS_POINTS = 10_000;
    uint256 public constant MAX_PLATFORM_FEE = 500;

    // Use sentinel address instead of zero address to avoid MetaMask warning
    address public constant NATIVE_CURRENCY = address(0x0000000000000000000000000000000000000001);

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

    uint256 private _nextTokenId;
    uint256 public platformFee;
    address public platformFeeRecipient;

    mapping(uint256 => Invoice) private _invoices;
    mapping(address => uint256[]) private _creatorInvoices;
    mapping(address => uint256[]) private _recipientInvoices;

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

    error InvalidRecipient();
    error InvalidAmount();
    error InvalidDueDate();
    error InvalidSplits();
    error SplitsTotalInvalid();
    error TooManySplits();
    error InvoiceNotFound();
    error InvoiceNotPending();
    error InsufficientPayment();
    error NotInvoiceCreator();
    error TransferFailed();
    error InvalidPlatformFee();
    error InvalidFeeRecipient();

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

        platformFeeRecipient = feeRecipient;
        platformFee = initialFee;
        _nextTokenId = 1;
    }

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

    function payInvoice(uint256 invoiceId) external payable nonReentrant whenNotPaused {
        Invoice storage invoice = _invoices[invoiceId];

        if (invoice.id == 0) revert InvoiceNotFound();
        if (invoice.status != InvoiceStatus.Pending) revert InvoiceNotPending();
        if (invoice.currency != NATIVE_CURRENCY) revert InsufficientPayment();

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
        if (invoice.currency == NATIVE_CURRENCY) revert InsufficientPayment();

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

    function cancelInvoice(uint256 invoiceId) external whenNotPaused {
        Invoice storage invoice = _invoices[invoiceId];

        if (invoice.id == 0) revert InvoiceNotFound();
        if (invoice.creator != msg.sender) revert NotInvoiceCreator();
        if (invoice.status != InvoiceStatus.Pending) revert InvoiceNotPending();

        invoice.status = InvoiceStatus.Cancelled;
        emit InvoiceCancelled(invoiceId, msg.sender);
    }

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

    function calculatePaymentAmount(uint256 invoiceId) external view returns (uint256 total, uint256 fee) {
        Invoice storage invoice = _invoices[invoiceId];
        if (invoice.id == 0) revert InvoiceNotFound();

        fee = (invoice.amount * platformFee) / BASIS_POINTS;
        total = invoice.amount + fee;
    }

    function setPlatformFee(uint256 newFee) external onlyRole(ADMIN_ROLE) {
        if (newFee > MAX_PLATFORM_FEE) revert InvalidPlatformFee();
        platformFee = newFee;
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
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

    receive() external payable {}
}
