// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/GenomeVault.sol";

contract DeployGenomeVault is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy with native PAS as payment (address(0) placeholder)
        // Platform fee: 2.5% (250 bps)
        // Fee recipient: deployer
        address deployer = vm.addr(deployerPrivateKey);
        
        // For testnet, we use a mock USDC or just use native PAS
        // Deploy a simple mock ERC20 for USDC
        MockUSDC usdc = new MockUSDC();
        
        GenomeVault vault = new GenomeVault(
            address(usdc),
            250,            // 2.5% platform fee
            deployer        // fee recipient
        );

        console.log("GenomeVault deployed at:", address(vault));
        console.log("Mock USDC deployed at:", address(usdc));
        console.log("Fee recipient:", deployer);
        
        vm.stopBroadcast();
    }
}

// Simple mock USDC for testnet
contract MockUSDC {
    string public name = "USD Coin (Mock)";
    string public symbol = "USDC";
    uint8 public decimals = 6;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    uint256 public totalSupply;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        // Mint 1M USDC to deployer for testing
        _mint(msg.sender, 1_000_000 * 10**6);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function _mint(address to, uint256 amount) internal {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
