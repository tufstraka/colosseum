// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IXcm, XCM_PRECOMPILE_ADDRESS} from "./interfaces/IXcm.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VaultstoneXCM
 * @notice Cross-chain payment handler using Polkadot XCM precompile
 * @dev Enables invoices to be paid from any Polkadot parachain
 */
contract VaultstoneXCM is Ownable {
    IXcm public constant xcm = IXcm(XCM_PRECOMPILE_ADDRESS);
    
    // Registered parachain IDs and their sovereign accounts
    mapping(uint32 => bytes) public parachainLocations;
    
    // Events
    event CrossChainPaymentInitiated(
        uint256 indexed invoiceId,
        uint32 indexed sourceParachain,
        address indexed payer,
        uint256 amount
    );
    
    event CrossChainPaymentReceived(
        uint256 indexed invoiceId,
        uint32 indexed sourceParachain,
        uint256 amount
    );
    
    event ParachainRegistered(uint32 indexed parachainId, bytes location);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @notice Register a parachain for cross-chain payments
     * @param parachainId The parachain ID (e.g., 1000 for Asset Hub)
     * @param locationEncoded SCALE-encoded MultiLocation for the parachain
     */
    function registerParachain(
        uint32 parachainId, 
        bytes calldata locationEncoded
    ) external onlyOwner {
        parachainLocations[parachainId] = locationEncoded;
        emit ParachainRegistered(parachainId, locationEncoded);
    }
    
    /**
     * @notice Build an XCM message for cross-chain payment
     * @param invoiceId The invoice to pay
     * @param recipient The recipient address on this chain
     * @param amount Amount in native tokens (DOT)
     * @return message SCALE-encoded XCM message
     */
    function buildPaymentXcm(
        uint256 invoiceId,
        address recipient,
        uint256 amount
    ) public pure returns (bytes memory message) {
        // Build XCM program:
        // 1. WithdrawAsset - Withdraw DOT from sender's parachain account
        // 2. BuyExecution - Pay for execution on Hub
        // 3. DepositAsset - Deposit to recipient
        // 4. SetTopic - Tag with invoice ID for tracking
        
        // This is a simplified representation - actual encoding requires SCALE codec
        // In production, use a library or off-chain encoding
        
        // XCM V4 program structure (simplified)
        bytes memory xcmProgram = abi.encodePacked(
            uint8(0x05), // XCM V4 prefix
            uint8(0x10), // 4 instructions
            // WithdrawAsset instruction
            _encodeWithdrawAsset(amount),
            // BuyExecution instruction  
            _encodeBuyExecution(amount / 10), // 10% for fees
            // DepositAsset instruction
            _encodeDepositAsset(recipient),
            // SetTopic for tracking
            _encodeSetTopic(invoiceId)
        );
        
        return xcmProgram;
    }
    
    /**
     * @notice Execute a cross-chain payment via XCM
     * @param invoiceId Invoice to pay
     * @param recipient Payment recipient
     * @param amount Amount to pay
     */
    function executePayment(
        uint256 invoiceId,
        address recipient,
        uint256 amount
    ) external payable {
        require(msg.value >= amount, "Insufficient payment");
        
        // Build the XCM message
        bytes memory message = buildPaymentXcm(invoiceId, recipient, amount);
        
        // Get required weight
        IXcm.Weight memory weight = xcm.weighMessage(message);
        
        // Add 10% buffer to weight
        weight.refTime = weight.refTime * 110 / 100;
        weight.proofSize = weight.proofSize * 110 / 100;
        
        // Execute the XCM
        xcm.execute(message, weight);
        
        emit CrossChainPaymentInitiated(invoiceId, 0, msg.sender, amount);
    }
    
    /**
     * @notice Send payment request to another parachain
     * @param parachainId Target parachain ID
     * @param invoiceId Invoice to request payment for
     * @param amount Amount requested
     */
    function sendPaymentRequest(
        uint32 parachainId,
        uint256 invoiceId,
        uint256 amount
    ) external {
        bytes memory destination = parachainLocations[parachainId];
        require(destination.length > 0, "Parachain not registered");
        
        // Build XCM message for payment request
        bytes memory message = _buildPaymentRequestXcm(invoiceId, amount);
        
        // Send to destination parachain
        xcm.send(destination, message);
    }
    
    /**
     * @notice Receive and process cross-chain payment notification
     * @dev Called by XCM executor when payment arrives from another chain
     */
    function receivePayment(
        uint256 invoiceId,
        uint32 sourceParachain,
        uint256 amount
    ) external {
        // In production, this would be called via XCM Transact
        // and would include proper origin verification
        emit CrossChainPaymentReceived(invoiceId, sourceParachain, amount);
    }
    
    // ============ Internal Encoding Helpers ============
    
    function _encodeWithdrawAsset(uint256 amount) internal pure returns (bytes memory) {
        // Simplified - actual SCALE encoding is more complex
        return abi.encodePacked(
            uint8(0x00), // WithdrawAsset opcode
            uint8(0x01), // 1 asset
            uint8(0x00), // Native asset (DOT)
            _encodeCompactU128(amount)
        );
    }
    
    function _encodeBuyExecution(uint256 feeAmount) internal pure returns (bytes memory) {
        return abi.encodePacked(
            uint8(0x13), // BuyExecution opcode
            uint8(0x00), // Native asset
            _encodeCompactU128(feeAmount),
            uint8(0x00)  // Unlimited weight
        );
    }
    
    function _encodeDepositAsset(address recipient) internal pure returns (bytes memory) {
        return abi.encodePacked(
            uint8(0x0D), // DepositAsset opcode
            uint8(0x01), // 1 asset (wildcard)
            uint8(0x01), // AccountId32 junction
            bytes32(uint256(uint160(recipient))) // Convert address to bytes32
        );
    }
    
    function _encodeSetTopic(uint256 invoiceId) internal pure returns (bytes memory) {
        return abi.encodePacked(
            uint8(0x1F), // SetTopic opcode
            bytes32(invoiceId)
        );
    }
    
    function _buildPaymentRequestXcm(
        uint256 invoiceId,
        uint256 amount
    ) internal pure returns (bytes memory) {
        // Build a Transact XCM that will call payInvoice on the remote chain
        return abi.encodePacked(
            uint8(0x05), // XCM V4
            uint8(0x04), // 1 instruction
            uint8(0x06), // Transact opcode
            // Encoded call to payInvoice(invoiceId)
            abi.encodeWithSignature("payInvoice(uint256)", invoiceId),
            _encodeCompactU128(amount)
        );
    }
    
    function _encodeCompactU128(uint256 value) internal pure returns (bytes memory) {
        // Simplified SCALE compact encoding
        if (value < 0x40) {
            return abi.encodePacked(uint8(value << 2));
        } else if (value < 0x4000) {
            return abi.encodePacked(uint16((value << 2) | 0x01));
        } else if (value < 0x40000000) {
            return abi.encodePacked(uint32((value << 2) | 0x02));
        } else {
            // For larger values, use big integer encoding
            return abi.encodePacked(uint8(0x03), uint128(value));
        }
    }
    
    // Allow contract to receive native tokens
    receive() external payable {}
}
