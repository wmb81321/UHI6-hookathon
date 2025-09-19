//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DeployHelpers.s.sol";
import { DeployConvexoComplete } from "./DeployConvexoComplete.s.sol";

/**
 * @notice Main deployment script for Convexo platform
 * @dev Deploys ComplianceNFT and CompliantLPHook with proper linking and admin setup
 *
 * Example: yarn deploy # runs this script (without --file flag)
 */
contract DeployScript is ScaffoldETHDeploy {
    function run() external {
        console.log("=== Deploying Complete Convexo Platform ===");
        console.log("This will deploy ComplianceNFT + CompliantLPHook with proper linking");
        console.log("");
        
        // Deploy everything using the complete script
        DeployConvexoComplete deployConvexo = new DeployConvexoComplete();
        deployConvexo.run();
        
        console.log("");
        console.log("=== Deployment Complete ===");
        console.log("Your contracts are now available in the Debug section!");
        console.log("Admin panel will show live contract information.");
    }
}
