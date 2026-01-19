// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CarbonCredit.sol";

/**
 * @title CarbonCreditTest
 * @dev Test suite for the CarbonCredit ERC20 token contract.
 */
contract CarbonCreditTest is Test {
    //===========
    // State Variables
    //===========

    CarbonCredit public carbonCredit;
    address public owner = address(this); // The test contract itself will be the owner
    address public user1 = address(0x1337); // A sample user address for testing
    address public user2 = address(0xbeefdead); // Add this line

    //===========
    // Setup
    //===========

    /**
     * @dev A special function that runs before each test case.
     * Used here to deploy a fresh instance of the CarbonCredit contract.
     */
    function setUp() public {
        // The test contract (owner) deploys the CarbonCredit contract
        carbonCredit = new CarbonCredit();
    }

    //===========
    // Test Cases
    //===========

    /**
     * @dev Tests if the contract deploys with the correct name and symbol.
     */
    function testInitialNameAndSymbol() public {
        assertEq(carbonCredit.name(), "Blue Carbon Credit", "Token name should be correct.");
        assertEq(carbonCredit.symbol(), "BCC", "Token symbol should be correct.");
    }

    /**
     * @dev Tests if the owner can successfully mint new tokens.
     */
    function testOwnerCanMint() public {
        // Arrange: Check initial balance is 0
        assertEq(carbonCredit.balanceOf(user1), 0);

        // Act: Owner mints 100 tokens to user1
        uint256 amountToMint = 100 * 10**18; // 100 tokens with 18 decimals
        carbonCredit.mint(user1, amountToMint);

        // Assert: Check new balance is correct
        assertEq(carbonCredit.balanceOf(user1), amountToMint);
    }

    /**
     * @dev Tests that a non-owner CANNOT mint new tokens.
     * This is a "revert test" - it passes only if the transaction fails correctly.
     */
    function testRevertWhen_NonOwnerCannotMint() public {
    // Expect revert with the correct custom error
    vm.expectRevert(
        abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user1)
    );

    vm.prank(user1);
    carbonCredit.mint(user1, 100 * 10**18);
    }

    /**
 * @dev Tests the full lifecycle: minting tokens and then transferring them. 
 */
function testFullTokenLifecycle() public {
    // Arrange: Owner mints 100 tokens to user1
    uint256 initialAmount = 100 * 10**18;
    carbonCredit.mint(user1, initialAmount);

    // Sanity check the balances after minting
    assertEq(carbonCredit.balanceOf(user1), initialAmount, "user1 should have the initial amount");
    assertEq(carbonCredit.balanceOf(user2), 0, "user2 should have zero tokens");

    // Act: user1 transfers 30 tokens to user2
    uint256 transferAmount = 30 * 10**18;
    vm.prank(user1); // Simulate the next call as if it's from user1
    carbonCredit.transfer(user2, transferAmount);

    // Assert: Check the final balances are correct
    uint256 expectedUser1Balance = 70 * 10**18;
    assertEq(carbonCredit.balanceOf(user1), expectedUser1Balance, "user1 balance should be reduced");
    assertEq(carbonCredit.balanceOf(user2), transferAmount, "user2 should have received the tokens");
    }

    /**
 * @dev Tests the ownership transfer functionality.
 */
function testOwnershipTransfer() public {
    // Act 1: The current owner (this contract) transfers ownership to user1.
    carbonCredit.transferOwnership(user1);

    // Assert 1: Check that the new owner is correctly set to user1.
    assertEq(carbonCredit.owner(), user1, "Ownership should be transferred to user1");

    // Act 2: The NEW owner (user1) should now be able to mint tokens.
    uint256 mintAmount = 100 * 10**18;
    vm.prank(user1); // Simulate the call from the new owner
    carbonCredit.mint(user2, mintAmount);

    // Assert 2: Confirm the mint was successful by checking the balance.
    assertEq(carbonCredit.balanceOf(user2), mintAmount, "New owner should be able to mint");

    // Act 3: The OLD owner (this contract) should now FAIL to mint.
    // This is a revert test. It passes if the call fails as expected.
    vm.expectRevert(
        abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, owner)
    );
    carbonCredit.mint(user2, 50 * 10**18); // This call should be rejected
}

}