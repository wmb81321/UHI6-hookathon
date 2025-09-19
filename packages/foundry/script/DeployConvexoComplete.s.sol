// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DeployHelpers.s.sol";
import "../contracts/ ComplianceNFT.sol";
import "../contracts/hooks/CompliantLPHook.sol";

/**
 * @notice Complete deployment script for Convexo platform
 * @dev Deploys ComplianceNFT with correct admin, then deploys CompliantLPHook linked to it
 */
contract DeployConvexoComplete is ScaffoldETHDeploy {
    function run() external ScaffoldEthDeployerRunner {
        console.log("=== Deploying Complete Convexo Platform ===");
        
        // Step 1: Deploy ComplianceNFT
        console.log("1. Deploying ComplianceNFT...");
        ComplianceNFT complianceNFT = new ComplianceNFT("Convexo ComplianceNFT", "CONVEXO");
        
        // Set the correct admin address
        address adminAddress = 0x70478DBB02b4026437E5015A0B4798c99E04C564;
        complianceNFT.transferOwnership(adminAddress);
        
        console.log("   ComplianceNFT deployed at:", address(complianceNFT));
        console.log("   Admin/Owner set to:", adminAddress);
        
        // Step 2: Deploy CompliantLPHook linked to the new NFT
        console.log("2. Deploying CompliantLPHook...");
        address poolManager = 0x00B036B58a818B1BC34d502D3fE730Db729e62AC; // Unichain Sepolia PoolManager
        
        CompliantLPHook compliantLPHook = new CompliantLPHook(
            poolManager,
            address(complianceNFT)  // Link to newly deployed NFT
        );
        
        console.log("   CompliantLPHook deployed at:", address(compliantLPHook));
        console.log("   Linked to ComplianceNFT:", address(complianceNFT));
        console.log("   Connected to PoolManager:", poolManager);
        
        // Add both deployments to the list for export
        deployments.push(Deployment("ComplianceNFT", address(complianceNFT)));
        deployments.push(Deployment("CompliantLPHook", address(compliantLPHook)));
        
        console.log("");
        console.log("=== Convexo Deployment Complete ===");
        console.log("Configuration Summary:");
        console.log("- ComplianceNFT:", address(complianceNFT));
        console.log("- CompliantLPHook:", address(compliantLPHook));
        console.log("- Admin Address:", adminAddress);
        console.log("- PoolManager:", poolManager);
        console.log("");
        console.log("Admin", adminAddress, "can now:");
        console.log("  - Mint ComplianceNFTs to users");
        console.log("  - Renew expired NFTs");
        console.log("  - Revoke NFTs from non-compliant users");
        console.log("");
        console.log("Hook enforces that ONLY NFT holders can:");
        console.log("  - Swap USDC/ECOP in pools using this hook");
        console.log("  - Add/Remove liquidity in pools using this hook");
        console.log("");
        console.log("Ready for USDC/ECOP pool creation on Uniswap.org!");
        console.log("- USDC: 0x31d0220469e10c4E71834a79b1f276d740d3768F");
        console.log("- ECOP: 0xfa3d179e2440d8a1fdf8ddbb3f3d23c36683d78b");
    }
}
