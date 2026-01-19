// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/StakeRepatation.sol";
import "../src/CarbonCredit.sol"; // Using CarbonCredit as our ERC20 staking token

contract StakeReputationTest is Test {
    //===========
    // State Variables
    //===========

    StakeReputation public stakeReputation;
    CarbonCredit public stakingToken;

    address public owner = address(this);
    address public admin = address(this);
    address public ngo1 = vm.addr(1);
    address public verificationContract = vm.addr(0xABC); // A mock address for the Verification contract

    //===========
    // Setup
    //===========

    function setUp() public {
        // Deploy the ERC20 token that will be used for staking
        stakingToken = new CarbonCredit();
        
        // Deploy the StakeReputation contract, giving it the token's address
        stakeReputation = new StakeReputation(address(stakingToken));
        
        // Link the StakeReputation contract to our mock Verification contract address
        stakeReputation.setVerificationContract(verificationContract);
    }

    //========================
    // Staking & Withdrawing Tests
    //========================

    function testCanStakeAndWithdrawTokens() public {
        uint256 stakeAmount = 150 * 10**18; // More than the 100 token minimum
        
        // 1. Mint staking tokens to the NGO
        stakingToken.mint(ngo1, stakeAmount);
        
        // 2. NGO must approve the StakeReputation contract to spend its tokens
        vm.startPrank(ngo1);
        stakingToken.approve(address(stakeReputation), stakeAmount);
        
        // 3. NGO stakes the tokens
        stakeReputation.stakeTokens(stakeAmount);
        vm.stopPrank();

        // Assert after staking
        assertEq(stakeReputation.stakedAmount(ngo1), stakeAmount, "Staked amount should be correct");
        assertEq(stakingToken.balanceOf(address(stakeReputation)), stakeAmount, "Contract balance should increase");

        // 4. NGO withdraws the tokens
        vm.prank(ngo1);
        stakeReputation.withdrawStake(stakeAmount);

        // Assert after withdrawing
        assertEq(stakeReputation.stakedAmount(ngo1), 0, "Staked amount should be zero");
        assertEq(stakingToken.balanceOf(address(stakeReputation)), 0, "Contract balance should be zero");
    }

    function testRevertWhen_CannotStakeBelowMinimum() public {
        uint256 stakeAmount = 50 * 10**18; // Less than the 100 token minimum
        stakingToken.mint(ngo1, stakeAmount);
        
        vm.startPrank(ngo1);
        stakingToken.approve(address(stakeReputation), stakeAmount);
        
        vm.expectRevert("Amount is less than minimum stake.");
        stakeReputation.stakeTokens(stakeAmount);
    }

    //========================
    // Slashing & Reputation Tests
    //========================

    function testVerificationContractCanSlashStake() public {
        // Arrange: NGO stakes 100 tokens
        uint256 stakeAmount = 100 * 10**18;
        stakingToken.mint(ngo1, stakeAmount);
        vm.startPrank(ngo1);
        stakingToken.approve(address(stakeReputation), stakeAmount);
        stakeReputation.stakeTokens(stakeAmount);
        vm.stopPrank();

        // Act: The trusted Verification contract calls slashStake
        vm.prank(verificationContract);
        stakeReputation.slashStake(ngo1);

        // Assert: The stake should be reduced by the penaltyRate (default 25%)
        uint256 expectedStake = stakeAmount * 75 / 100;
        assertEq(stakeReputation.stakedAmount(ngo1), expectedStake);
    }
    
    function testRevertWhen_NonVerificationContractCannotSlashStake() public {
        // Arrange: NGO stakes 100 tokens
        uint256 stakeAmount = 100 * 10**18;
        stakingToken.mint(ngo1, stakeAmount);
        vm.startPrank(ngo1);
        stakingToken.approve(address(stakeReputation), stakeAmount);
        stakeReputation.stakeTokens(stakeAmount);
        vm.stopPrank();

        // Act & Assert: An unauthorized address (like ngo1) tries to call slashStake
        vm.expectRevert("Only the verification contract can call this.");
        vm.prank(ngo1);
        stakeReputation.slashStake(ngo1);
    }
    
    function testVerificationContractCanUpdateReputation() public {
        // Act: Verification contract increases reputation
        vm.prank(verificationContract);
        stakeReputation.increaseReputation(ngo1);
        
        // Assert: Reputation score should increase by the reward amount (default 10)
        assertEq(stakeReputation.reputationScore(ngo1), 10);
        
        // Act: Verification contract decreases reputation
        vm.prank(verificationContract);
        stakeReputation.decreaseReputation(ngo1);
        
        // Assert: Reputation score should go back to 0
        assertEq(stakeReputation.reputationScore(ngo1), 0);
    }
}