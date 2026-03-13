// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/VaultstoneInvoice.sol";

contract DeployVaultstone is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address admin = vm.envAddress("ADMIN_ADDRESS");
        address feeRecipient = vm.envAddress("FEE_RECIPIENT_ADDRESS");
        uint256 platformFee = vm.envOr("PLATFORM_FEE", uint256(100)); // Default 1%

        vm.startBroadcast(deployerPrivateKey);

        VaultstoneInvoice invoice = new VaultstoneInvoice(
            "Vaultstone Invoice",
            "VINV",
            admin,
            feeRecipient,
            platformFee
        );

        console.log("VaultstoneInvoice deployed at:", address(invoice));
        console.log("Admin:", admin);
        console.log("Fee Recipient:", feeRecipient);
        console.log("Platform Fee:", platformFee, "basis points");

        vm.stopBroadcast();
    }
}
