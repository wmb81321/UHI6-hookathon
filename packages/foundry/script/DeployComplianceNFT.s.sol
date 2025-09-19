// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DeployHelpers.s.sol";
import "../contracts/ComplianceNFT.sol";

/**
 * @notice Deploy script for ComplianceNFT contract
 * @dev Inherits ScaffoldETHDeploy which:
 *      - Includes forge-std/Script.sol for deployment
 *      - Includes ScaffoldEthDeployerRunner modifier
 *      - Provides `deployer` variable
 * Example:
 * yarn deploy --file DeployComplianceNFT.s.sol  # local anvil chain
 * yarn deploy --file DeployComplianceNFT.s.sol --network optimism # live network (requires keystore)
 */
contract DeployComplianceNFT is ScaffoldETHDeploy {
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
        // Deploy ComplianceNFT with name and symbol
        ComplianceNFT complianceNFT = new ComplianceNFT("ComplianceNFT", "CNFT");
        
        // Transfer ownership to the specified admin address
        address adminAddress = 0x70478DBB02b4026437E5015A0B4798c99E04C564;
        complianceNFT.transferOwnership(adminAddress);
        
        // Add deployment to the list for export
        deployments.push(Deployment("ComplianceNFT", address(complianceNFT)));
        
        console.log("ComplianceNFT deployed at:", address(complianceNFT));
        console.log("Admin/Owner set to:", adminAddress);
        console.log("Admin can now mint, renew, and revoke NFTs");
    }
}
