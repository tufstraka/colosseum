// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @dev The on-chain address of the XCM (Cross-Consensus Messaging) precompile.
address constant XCM_PRECOMPILE_ADDRESS = address(0xA0000);

/// @title XCM Precompile Interface
/// @notice A low-level interface for interacting with `pallet_xcm`.
interface IXcm {
    /// @notice Weight v2 used for measurement for an XCM execution
    struct Weight {
        uint64 refTime;
        uint64 proofSize;
    }

    /// @notice Executes an XCM message locally on the current chain with the caller's origin.
    function execute(bytes calldata message, Weight calldata weight) external;

    /// @notice Sends an XCM message to another parachain or consensus system.
    function send(bytes calldata destination, bytes calldata message) external;

    /// @notice Estimates the `Weight` required to execute a given XCM message.
    function weighMessage(bytes calldata message) external view returns (Weight memory weight);
}
