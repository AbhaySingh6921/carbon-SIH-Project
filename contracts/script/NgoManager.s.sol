// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/NGOManager.sol";

contract DeployNGOManager is Script {
    function run() external returns (address) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        NGOManager manager = new NGOManager();
        
        vm.stopBroadcast();
        console.log(" NGOManager contract deployed at:", address(manager));
        return address(manager);
    }
}
