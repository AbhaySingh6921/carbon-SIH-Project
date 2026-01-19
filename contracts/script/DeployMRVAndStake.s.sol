// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/StakeRepatation.sol"; // Using your filename
import "../src/MRVRegistry.sol";

/**
 * @title DeployMRVAndStake
 * @dev Deploys only the MRVRegistry and StakeReputation contracts and links the MRVRegistry
 * to an existing NGOManager.
 */
contract DeployMRVAndStake is Script {
    function run() external {
        // --- 1. Load Configuration from .env file ---
        console.log("Loading configuration from .env file...");
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address carbonCreditAddress = vm.envAddress("CARBON_TOKEN_ADDRESS");
        address ngoManagerAddress = vm.envAddress("NGO_MANAGER_ADDRESS");

        // --- Sanity Checks ---
        require(deployerPrivateKey != 0, "PRIVATE_KEY not set in .env");
        require(carbonCreditAddress != address(0), "CARBON_TOKEN_ADDRESS not set in .env");
        require(ngoManagerAddress != address(0), "NGO_MANAGER_ADDRESS not set in .env");

        vm.startBroadcast(deployerPrivateKey);

        // --- 2. Deploy Contracts ---
        console.log("\nDeploying StakeRepatation...");
        StakeReputation stakeReputation = new StakeReputation(carbonCreditAddress);
        console.log("  -> Deployed at:", address(stakeReputation));

        console.log("Deploying MRVRegistry...");
        MRVRegistry mrvRegistry = new MRVRegistry(carbonCreditAddress);
        console.log("  -> Deployed at:", address(mrvRegistry));

        // --- 3. Post-Deployment Configuration (The CRITICAL Step) ---
        console.log("\n--- Configuring Contract Links ---");

        // Link the newly deployed MRVRegistry to your existing NGOManager contract
        console.log("Linking MRVRegistry -> NGOManager...");
        mrvRegistry.setNGOManager(ngoManagerAddress);

        vm.stopBroadcast();

        console.log(" MRVRegistry and StakeReputation deployed and configured successfully!");
        console.log("   MRVRegistry Address:", address(mrvRegistry));
        console.log("   StakeReputation Address:", address(stakeReputation));
    }
}
