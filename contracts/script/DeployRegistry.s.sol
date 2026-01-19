// FILE: script/DeployRegistry.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CarbonCredit.sol";
import "../src/MRVRegistry.sol";
import "../src/StakeRepatation.sol";
import "../src/Verification.sol";
import "../src/VerificationOrcale.sol";

contract DeployRegistry is Script {
    function run() external returns (
        address carbonCredit,
        address stakeReputation,
        address mrvRegistry,
        address verification,
        address verificationOracle
    ) {
        // This cheatcode tells Foundry to start broadcasting transactions
        vm.startBroadcast();

        // --- 1. Define Key Addresses ---
        address deployer = msg.sender;
        console.log("Using deployer address:", deployer);
        address initialAdmin = deployer; // The deployer will also be the first admin
        console.log("Setting initial admin to:", initialAdmin);

        // --- 2. Deploy CarbonCredit Token ---
        CarbonCredit ccToken = new CarbonCredit();
        carbonCredit = address(ccToken);
        console.log("CarbonCredit token deployed at:", carbonCredit);
        
        uint256 initialMint = 1000 * 1e18; // 1000 BCC
        ccToken.mint(deployer, initialMint);
        console.log("Initial 1000 BCC minted to deployer for staking/testing.");

        // --- 3. Deploy StakeReputation ---
        StakeReputation srContract = new StakeReputation(carbonCredit);
        stakeReputation = address(srContract);
        console.log("StakeReputation contract deployed at:", stakeReputation);

        // --- 4. Deploy MRVRegistry ---
        MRVRegistry mrvContract = new MRVRegistry(carbonCredit);
        mrvRegistry = address(mrvContract);
        console.log("MRVRegistry contract deployed at:", mrvRegistry);

        // --- 5. Deploy Verification (with the correct constructor) ---
        Verification vContract = new Verification(mrvRegistry, stakeReputation, initialAdmin);
        verification = address(vContract);
        console.log("Verification contract deployed at:", verification);

        // --- 6. Deploy VerificationOracle ---
        VerificationOracle voContract = new VerificationOracle(verification);
        verificationOracle = address(voContract);
        console.log("VerificationOracle contract deployed at:", verificationOracle);

        // --- 7. Post-Deployment Configuration (CRUCIAL) ---
        console.log("--- Starting Post-Deployment Configuration ---");

        // BEST PRACTICE: Grant MINTER_ROLE instead of transferring ownership.
        // This allows MRVRegistry to mint new tokens without having full control.
      

        // Tell StakeReputation which contract to trust for slashing penalties.
        console.log("Setting Verification contract in StakeReputation...");
        srContract.setVerificationContract(verification);

        // THIS IS THE FIX: Tell MRVRegistry which contract to trust for status updates.
        // Without this, the status will never update.
        console.log("Authorizing Verification contract in MRVRegistry...");
        mrvContract.setVerificationContract(verification);

        // This cheatcode tells Foundry to stop broadcasting transactions
        vm.stopBroadcast();
    }
}