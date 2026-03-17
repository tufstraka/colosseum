// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/VaultstoneInvoice.sol";

contract DeployLocal is Script {
    function run() external {
        uint256 privateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address admin = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
        
        vm.startBroadcast(privateKey);
        
        VaultstoneInvoice invoice = new VaultstoneInvoice(
            "Vaultstone Invoice",
            "VINV",
            admin,
            admin,
            100 // 1% fee
        );
        
        console.log("Deployed VaultstoneInvoice at:", address(invoice));
        
        vm.stopBroadcast();
    }
}
