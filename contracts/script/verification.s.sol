// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Verification.sol"; // Adjust path to your contract

contract DeployVerification is Script {
    function run() external {
        // --- Load deployer private key from environment ---
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // --- Start broadcasting transactions ---
        vm.startBroadcast(deployerPrivateKey);

        // --- Load addresses from environment ---
        address registryAddress = vm.envAddress("MRV_REGISTRY_ADDRESS");
        address stakeReputationAddress = vm.envAddress("STAKE_REPUTATION_ADDRESS");
        address initialAdmin = vm.envAddress("INITIAL_ADMIN");
        address weatherSurvivalAddress = vm.envAddress("WEATHER_SURVIVAL_ADDRESS");

        // --- Deploy Verification contract ---
        Verification verification = new Verification(
            registryAddress,
            stakeReputationAddress,
            initialAdmin,
            weatherSurvivalAddress
        );

        console.log("Verification contract deployed at:", address(verification));

        vm.stopBroadcast();
    }
}
