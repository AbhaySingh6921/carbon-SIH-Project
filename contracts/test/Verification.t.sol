// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Verification.sol";
import "../src/MRVRegistry.sol";
import "../src/StakeRepatation.sol";
import "../src/CarbonCredit.sol";

// We need to redefine the MRVRegistry interface's enum for the test
interface IMRVRegistry_Test {
    enum VerificationStatus { Submitted, AIVerified, AdminVerified, SurvivalVerified, Disputed, Rejected }
}

contract VerificationTest is Test , IMRVRegistry_Test {
    //===========
    // State Variables - We need almost all our contracts for this test
    //===========

    Verification public verification;
    MRVRegistry public mrvRegistry;
    StakeReputation public stakeReputation;
    CarbonCredit public carbonCredit; // Used as the staking token

    address public owner = address(this);
    address public admin = address(this); // For simplicity, the test contract is the admin
    address public ngo1;

    //===========
    // Setup - This is an integration setup
    //===========

    function setUp() public {
    // Addresses
    admin = makeAddr("admin");
    ngo1 = makeAddr("ngo1");

    // Deploy all contracts as admin
    vm.startPrank(admin);

    carbonCredit = new CarbonCredit();
    stakeReputation = new StakeReputation(address(carbonCredit));
    mrvRegistry = new MRVRegistry(address(carbonCredit));

    verification = new Verification(address(mrvRegistry), address(stakeReputation),address(0));

    // Transfer MRVRegistry ownership to Verification
    mrvRegistry.transferOwnership(address(verification));

    vm.stopPrank();

    // Set Verification contract in StakeReputation (callable by admin/owner)
    vm.prank(admin);
    stakeReputation.setVerificationContract(address(verification));
}
    //========================
    // Admin Verification Tests
    //========================
    
    function testAdminCanApproveSubmission() public {
        // Arrange: NGO registers a plantation in the registry
        vm.prank(ngo1);
        mrvRegistry.registerPlantation("Mangrove", 100, "hash1","hii this discription","22.57","88.36");

        // Act: Admin approves the submission via the Verification contract
        vm.prank(admin);
        verification.submitAdminVerification(0, true);

        // Assert: The status in the MRVRegistry should be updated
        (
            uint256 id,
            address uploader,
            string memory species,
            uint256 treeCount,
            string memory ipfsHash,
            MRVRegistry.VerificationStatus status,
            bool creditsIssued,
            string memory description,
            string memory latitude,
            string memory longitude
        ) = mrvRegistry.plantations(0);
        assertEq(uint(status), uint(VerificationStatus.AdminVerified));
    }

    function testRevertWhen_NonAdminCannotApproveSubmission() public {
        vm.prank(ngo1);
        mrvRegistry.registerPlantation("Mangrove", 100, "hash1","hii this discription","22.57","88.36");

       vm.expectRevert(bytes("Not the contract owner"));
        vm.prank(ngo1); // NGO tries to approve their own submission
        verification.submitAdminVerification(0, true);
    }

    //========================
    // Integration Test: Slashing Stake
    //========================


    /**
     * @dev This is the most important integration test. It checks the full penalty lifecycle.
     */
    function testAdminRejectionFlagsAsFakeAndSlashesStake() public {
        // Arrange Part 1: NGO stakes tokens
        uint256 stakeAmount = 100 * 10**18;
        
        // --- THIS IS THE FIX ---
        // The admin (the owner of the CarbonCredit contract) mints tokens for the NGO
        vm.prank(admin); 
        carbonCredit.mint(ngo1, stakeAmount);
        
        // NGO approves the StakeReputation contract to spend their tokens
        vm.prank(ngo1);
        carbonCredit.approve(address(stakeReputation), stakeAmount);
        
        // NGO calls the stake function
        vm.prank(ngo1);
        stakeReputation.stakeTokens(stakeAmount);
        assertEq(stakeReputation.stakedAmount(ngo1), stakeAmount);

        // Arrange Part 2: NGO registers a plantation in the registry
        vm.prank(ngo1);
        mrvRegistry.registerPlantation("Fake Trees", 100, "fake_hash", "Fake plantation description", "22.57", "88.36");

        // Act: Admin REJECTS the submission (approves=false).
        vm.prank(admin);
        verification.submitAdminVerification(0, false);

        // Assert Part 1: The NGO's stake should be automatically reduced.
        uint256 expectedStake = stakeAmount * 75 / 100; // 100 - 25% penalty
        assertEq(stakeReputation.stakedAmount(ngo1), expectedStake, "Stake should be slashed");

        // Assert Part 2: The plantation status in the registry should be 'Rejected'.
        (
            ,,,,,
            MRVRegistry.VerificationStatus status,
            ,,,
            
        ) = mrvRegistry.plantations(0);
        assertEq(uint(status), uint(VerificationStatus.Rejected), "Status should be Rejected");
    }

    
    //========================
// isVerified Logic Tests
//========================

/**
 * @dev Tests that isVerified() returns true when all conditions are met.
 */
// function testIsVerified_ReturnsTrue_WhenAllConditionsMet() public {
//     // Arrange: Register a plantation and meet all verification criteria
//     vm.prank(ngo1);
//     mrvRegistry.registerPlantation("Test Plant", 100, "hash", "Test Desc", "22.57", "88.36");

//     // 1. Admin verifies
//     vm.prank(admin);
//     verification.submitAdminVerification(0, true);

//     // 2. AI verifies (admin acts as oracle for test)
//     vm.prank(admin);
//     verification.submitAIVerification(0, true);

//     // 3. Peers verify (meet the threshold of 3)
//     vm.prank(vm.addr(3)); // Peer 1
//     verification.submitPeerVerification(0);
//     vm.prank(vm.addr(4)); // Peer 2
//     verification.submitPeerVerification(0);
//     vm.prank(vm.addr(5)); // Peer 3
//     verification.submitPeerVerification(0);

//     // Act & Assert: The isVerified function should now return true
//     assertTrue(verification.isVerified(0), "Should be verified when all conditions are met");
// }

/**
 * @dev Tests that isVerified() returns false if conditions are not met.
 */
// function testIsVerified_ReturnsFalse_WhenConditionsNotMet() public {
//     // Arrange: Register and verify by Admin and AI, but not enough peers
//     vm.prank(ngo1);
//     mrvRegistry.registerPlantation("Test Plant", 100, "hash", "Test Desc", "22.57", "88.36");
//     vm.prank(admin);
//     verification.submitAdminVerification(0, true);
//     vm.prank(admin);
//     verification.submitAIVerification(0, true);
    
//     // Only 2 peers verify, which is less than the threshold of 3
//     vm.prank(vm.addr(3));
//     verification.submitPeerVerification(0);
//     vm.prank(vm.addr(4));
//     verification.submitPeerVerification(0);

//     // Act & Assert: The isVerified function should return false
//     assertFalse(verification.isVerified(0), "Should not be verified with insufficient peers");
// }

//========================
// Configuration Tests
//========================

/**
 * @dev Tests that only the owner can set the verification threshold.
 */
// function testSetThreshold_AccessControl() public {
//     // Assert owner can set it
//     vm.prank(admin);
//     verification.setVerificationThreshold(5);
//     assertEq(verification.peerVerificationThreshold(), 5);

//     // Assert non-owner cannot set it
//     vm.expectRevert(bytes("Not the contract owner"));
//     vm.prank(ngo1);
//     verification.setVerificationThreshold(10);
// }
}