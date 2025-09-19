// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DeployHelpers.s.sol";
import "../contracts/hooks/CompliantLPHook.sol";

/**
 * @notice Deploy script for CompliantLPHook contract
 * @dev Inherits ScaffoldETHDeploy which:
 *      - Includes forge-std/Script.sol for deployment
 *      - Includes ScaffoldEthDeployerRunner modifier
 *      - Provides `deployer` variable
 * Example:
 * yarn deploy --file DeployCompliantLPHook.s.sol  # local anvil chain
 * yarn deploy --file DeployCompliantLPHook.s.sol --network optimism # live network (requires keystore)
 */
contract DeployCompliantLPHook is ScaffoldETHDeploy {
    /**
     * @dev Deployer setup based on `ETH_KEYSTORE_ACCOUNT` in `.env`:
     *      - "scaffold-eth-default": Uses Anvil's account #9 (0xa0Ee7A142d267C1f36714E4a8F75612F20a79720), no password prompt
     *      - "scaffold-eth-custom": requires password used while creating keystore
     *
     * Note: Must use ScaffoldEthDeployerRunner modifier to:
     *      - Setup correct `deployer` account and fund it
     *      - Export contract addresses & ABIs to `nextjs` packages
     */
    function run() external ScaffoldEthDeployerRunner {
        // Simple deployment parameters
        address poolManagerAddress = 0x00B036B58a818B1BC34d502D3fE730Db729e62AC; // Unichain Sepolia PoolManager
        
        // This script requires ComplianceNFT to be deployed first
        // For automatic linking, use DeployConvexoComplete.s.sol instead
        
        console.log("ERROR: This script cannot run standalone!");
        console.log("ComplianceNFT must be deployed first.");
        console.log("");
        console.log("Use instead:");
        console.log("  yarn deploy --file DeployConvexoComplete.s.sol --network unichainSepolia");
        console.log("");
        console.log("This will deploy both contracts with proper linking.");
        
        // Stop execution
        require(false, "Use DeployConvexoComplete.s.sol for proper deployment");
        
        console.log("Deploying Simple CompliantLPHook...");
        console.log("PoolManager:", poolManagerAddress);
        console.log("ComplianceNFT:", complianceNFTAddress);
        
        // Deploy the simple hook with just 2 parameters
        CompliantLPHook compliantLPHook = new CompliantLPHook(
            poolManagerAddress,
            complianceNFTAddress
        );
        
        // Add deployment to the list for export
        deployments.push(Deployment("CompliantLPHook", address(compliantLPHook)));
        
        console.log("");
        console.log("CompliantLPHook deployed at:", address(compliantLPHook));
        console.log("");
        console.log("Hook Configuration:");
        console.log("- PoolManager:", poolManagerAddress);
        console.log("- ComplianceNFT:", complianceNFTAddress);
        console.log("- Permissions: beforeSwap + beforeModifyPosition");
        console.log("");
        console.log("This hook enforces that ONLY holders of NFTs from");
        console.log(complianceNFTAddress, "can:");
        console.log("  - Perform swaps");
        console.log("  - Add/Remove liquidity");
        console.log("");
        console.log("Recommended tokens for pool:");
        console.log("- USDC: 0x31d0220469e10c4E71834a79b1f276d740d3768F");
        console.log("- ECOP: 0xfa3d179e2440d8a1fdf8ddbb3f3d23c36683d78b");
    }
}
