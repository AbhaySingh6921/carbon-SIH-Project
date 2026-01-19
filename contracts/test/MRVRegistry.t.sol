// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../src/MRVRegistry.sol";
import "../src/CarbonCredit.sol";

contract MRVRegistryTest is Test {
    //===========
    // State Variables
    //===========

    MRVRegistry public mrvRegistry;
    CarbonCredit public carbonCredit;

    address public owner = address(this);
    address public ngo1 = vm.addr(1);
    address public ngo2 = vm.addr(2);

    //===========
    // Setup
    //===========

    function setUp() public {
        carbonCredit = new CarbonCredit();
        mrvRegistry = new MRVRegistry(address(carbonCredit));
        carbonCredit.transferOwnership(address(mrvRegistry));
    }

    //========================
    // Registration Tests
    //========================

    function testCanRegisterPlantation() public {
        // Act: Call the register function with all 6 arguments
        vm.prank(ngo1);
        mrvRegistry.registerPlantation("Mangrove", 1000, "ipfs_hash_1", "Test Desc", "22.57", "88.36");

        // Assert: Check that the data was stored correctly by reading all 10 fields
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

        assertEq(id, 0);
        assertEq(uploader, ngo1);
        assertEq(species, "Mangrove");
        assertEq(treeCount, 1000);
        assertEq(ipfsHash, "ipfs_hash_1");
        assertEq(uint(status), uint(MRVRegistry.VerificationStatus.Submitted));
        assertEq(creditsIssued, false);
        assertEq(description, "Test Desc");
        assertEq(latitude, "22.57");
        assertEq(longitude, "88.36");
    }

    function testTracksPlantationsByUploader() public {
        // Act: Register plantations with the updated 6-argument function call
        vm.prank(ngo1);
        mrvRegistry.registerPlantation("Species A", 100, "hash1", "Desc A", "lat", "long"); // ID 0
        vm.prank(ngo2);
        mrvRegistry.registerPlantation("Species B", 200, "hash2", "Desc B", "lat", "long"); // ID 1
        vm.prank(ngo1);
        mrvRegistry.registerPlantation("Species C", 300, "hash3", "Desc C", "lat", "long"); // ID 2

        // Assert: This part remains the same and should work
        uint256[] memory ngo1Plantations = mrvRegistry.getPlantationsByUploader(ngo1);
        assertEq(ngo1Plantations.length, 2);
        assertEq(ngo1Plantations[0], 0);
        assertEq(ngo1Plantations[1], 2);
    }

    //========================
    // Access Control Tests
    //========================

    function testRevertWhen_NonOwnerCannotUpdateStatus() public {
        vm.prank(ngo1);
        mrvRegistry.registerPlantation("Mangrove", 1000, "ipfs_hash_1", "Desc", "lat", "long");

        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, ngo1)
        );
        vm.prank(ngo1);
        mrvRegistry.updateVerificationStatus(0, MRVRegistry.VerificationStatus.AdminVerified);
    }
    
    //========================
    // Credit Assignment Tests
    //========================

    function testCanAssignCreditsForVerifiedPlantation() public {
        vm.prank(ngo1);
        mrvRegistry.registerPlantation("Mangrove", 500, "ipfs_hash_1", "Desc", "lat", "long");
        
        mrvRegistry.updateVerificationStatus(0, MRVRegistry.VerificationStatus.SurvivalVerified);
        mrvRegistry.assignCredits(0);

        assertEq(carbonCredit.balanceOf(ngo1), 500, "NGO should receive 500 tokens");
        
        // Assert: Read the 10-field struct and check the creditsIssued flag
       (,,,,,, bool creditsIssued,,,) = mrvRegistry.plantations(0);
        assertTrue(creditsIssued, "Credits should be marked as issued");
    }

    function testRevertWhen_CannotAssignCreditsTwice() public {
        vm.prank(ngo1);
        mrvRegistry.registerPlantation("Mangrove", 500, "hash1", "Desc", "lat", "long");
        mrvRegistry.updateVerificationStatus(0, MRVRegistry.VerificationStatus.SurvivalVerified);
        mrvRegistry.assignCredits(0);

        vm.expectRevert(bytes("Credits already issued for this plantation."));
        mrvRegistry.assignCredits(0);
    }

    function testRevertWhen_CannotAssignCreditsIfNotVerified() public {
        vm.prank(ngo1);
        mrvRegistry.registerPlantation("Mangrove", 500, "hash1", "Desc", "lat", "long");

        vm.expectRevert(bytes("Plantation not fully verified."));
        mrvRegistry.assignCredits(0);
    }

    function testRevertWhen_ActionsOnNonExistentPlantation() public {
        uint256 nonExistentId = 0;
        string memory expectedError = "Plantation does not exist.";

        vm.expectRevert(bytes(expectedError));
        mrvRegistry.updateVerificationStatus(nonExistentId, MRVRegistry.VerificationStatus.AdminVerified);

        vm.expectRevert(bytes(expectedError));
        mrvRegistry.assignCredits(nonExistentId);
    }
}