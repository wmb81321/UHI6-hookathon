// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./DeployHelpers.s.sol";
import "../contracts/ComplianceNFT.sol";
import "../contracts/hooks/CompliantLPHook.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {HookMiner} from "v4-periphery/src/utils/HookMiner.sol";

/**
 * @notice Deploy CompliantLPHook with proper v4 address validation
 * @dev Uses HookMiner to find valid CREATE2 salt
 */
contract DeployCompliantHookWithMiner is ScaffoldETHDeploy {
    function run() external ScaffoldEthDeployerRunner {
        console.log("=== Deploying CompliantLPHook with HookMiner ===");
        
        // Step 1: Deploy ComplianceNFT first
        console.log("1. Deploying ComplianceNFT...");
        ComplianceNFT complianceNFT = new ComplianceNFT("Convexo ComplianceNFT", "CONVEXO");
        
        // Set the correct admin address
        address adminAddress = 0x70478DBB02b4026437E5015A0B4798c99E04C564;
        complianceNFT.transferOwnership(adminAddress);
        
        console.log("   ComplianceNFT deployed at:", address(complianceNFT));
        console.log("   Admin/Owner set to:", adminAddress);
        
        // Step 2: Get hook flags (convert permissions to uint160)
        uint160 flags = uint160(
            Hooks.BEFORE_SWAP_FLAG | 
            Hooks.BEFORE_ADD_LIQUIDITY_FLAG | 
            Hooks.BEFORE_REMOVE_LIQUIDITY_FLAG
        );
        
        // Step 3: Mine for valid hook address
        console.log("2. Mining for valid hook address...");
        address poolManager = 0x00B036B58a818B1BC34d502D3fE730Db729e62AC; // Unichain Sepolia PoolManager
        
        // Create the constructor args
        bytes memory constructorArgs = abi.encode(IPoolManager(poolManager), address(complianceNFT));
        
        // Mine for a valid CREATE2 salt using the CREATE2 Deployer Proxy
        address create2Deployer = 0x4e59b44847b379578588920cA78FbF26c0B4956C;
        (address hookAddress, bytes32 salt) = HookMiner.find(
            create2Deployer, // Use the standard CREATE2 deployer proxy
            flags,
            type(CompliantLPHook).creationCode,
            constructorArgs
        );
        
        console.log("   Found valid hook address:", hookAddress);
        console.log("   Using salt:", vm.toString(salt));
        
        // Step 4: Deploy hook using CREATE2 deployer proxy with the mined salt
        console.log("3. Deploying CompliantLPHook with CREATE2 Deployer Proxy...");
        
        // Use the CREATE2 deployer proxy
        bytes memory deployCode = abi.encodePacked(
            type(CompliantLPHook).creationCode,
            constructorArgs
        );
        
        // Deploy using CREATE2 proxy
        (bool success, bytes memory returnData) = create2Deployer.call(
            abi.encodePacked(salt, deployCode)
        );
        
        require(success, "CREATE2 deployment failed");
        
        CompliantLPHook compliantLPHook = CompliantLPHook(hookAddress);
        
        // Verify the address matches
        require(address(compliantLPHook) == hookAddress, "Address mismatch!");
        
        console.log("   CompliantLPHook deployed at:", address(compliantLPHook));
        console.log("   Linked to ComplianceNFT:", address(complianceNFT));
        console.log("   Connected to PoolManager:", poolManager);
        
        // Add both deployments to the list for export
        deployments.push(Deployment("ComplianceNFT", address(complianceNFT)));
        deployments.push(Deployment("CompliantLPHook", address(compliantLPHook)));
        
        console.log("");
        console.log("=== Deployment Complete with Valid Hook Address ===");
        console.log("- ComplianceNFT:", address(complianceNFT));
        console.log("- CompliantLPHook:", address(compliantLPHook));
        console.log("- Admin Address:", adminAddress);
        console.log("- PoolManager:", poolManager);
        console.log("");
        console.log("Hook address is now valid for Uniswap v4!");
        console.log("Ready for USDC/ECOP pool creation with proper hook support!");
    }
}
