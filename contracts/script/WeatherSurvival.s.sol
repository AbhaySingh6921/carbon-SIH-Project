// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/WeatherSurvival.sol"; // adjust the path if needed

contract DeployWeatherSurvival is Script {
    function run() external {
        // --- Load deployer private key from environment ---
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // --- Start broadcasting ---
        vm.startBroadcast(deployerPrivateKey);

        // --- Chainlink subscription ID ---
        uint64 subscriptionId = uint64(vm.envUint("CHAINLINK_SUBSCRIPTION_ID"));
        

        // --- Verification contract address ---
        address verificationContract = vm.envAddress("VERIFICATION_CONTRACT");

        // --- Deploy WeatherSurvival contract ---
        WeatherSurvival weather = new WeatherSurvival(
            subscriptionId,
            verificationContract
        );

        console.log("WeatherSurvival deployed at:", address(weather));

        vm.stopBroadcast();
    }
}
