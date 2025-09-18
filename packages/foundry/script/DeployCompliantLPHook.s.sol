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
        // Get ComplianceNFT address - should be deployed first
        string memory complianceNFTAddress = vm.envOr("COMPLIANCE_NFT_ADDRESS", string(""));
        
        // Get Uniswap v4 PoolManager address
        string memory poolManagerAddress = vm.envOr("POOL_MANAGER_ADDRESS", string(""));
        
        // Validate addresses
        require(bytes(complianceNFTAddress).length > 0, "ComplianceNFT address not set in env");
        require(bytes(poolManagerAddress).length > 0, "PoolManager address not set in env");
        
        // Deploy CompliantLPHook with PoolManager and ComplianceNFT addresses
        CompliantLPHook compliantLPHook = new CompliantLPHook(
            vm.parseAddress(poolManagerAddress),
            vm.parseAddress(complianceNFTAddress)
        );
        
        // Add deployment to the list for export
        deployments.push(Deployment("CompliantLPHook", address(compliantLPHook)));
        
        console.log("CompliantLPHook deployed at:", address(compliantLPHook));
        console.log("Using ComplianceNFT at:", complianceNFTAddress);
        console.log("Using PoolManager at:", poolManagerAddress);
    }
}
