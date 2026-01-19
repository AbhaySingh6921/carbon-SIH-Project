// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/VerificationOrcale.sol";

contract MockVerification is IVerification {
    event AIVerificationSubmitted(uint256 plantationId, bool approved);
    function submitAIVerification(uint256 _plantationId, bool _approved) external {
        emit AIVerificationSubmitted(_plantationId, _approved);
    }
}

contract VerificationOracleTest is Test {
    VerificationOracle public oracle;
    MockVerification public mockVerification;

    address public owner = address(this);
    address public oracleProvider = vm.addr(1);
    address public randomUser = vm.addr(2);

    function setUp() public {
        mockVerification = new MockVerification();
        oracle = new VerificationOracle(address(mockVerification));
    }

    function testOwnerCanSetOracleProvider() public {
        oracle.setOracleProvider(oracleProvider, true);
        assertTrue(oracle.isOracleProvider(oracleProvider));
        oracle.setOracleProvider(oracleProvider, false);
        assertFalse(oracle.isOracleProvider(oracleProvider));
    }

    // RENAMED FUNCTION
    function testRevertIf_CallerIsNotOwner() public {
        vm.expectRevert(
        abi.encodeWithSelector(
            Ownable.OwnableUnauthorizedAccount.selector,
            randomUser
        )
       );
        vm.prank(randomUser);
        oracle.setOracleProvider(oracleProvider, true);

    }

    // function testOracleCanSubmitResult() public {
    //     oracle.setOracleProvider(oracleProvider, true);
    //     vm.expectEmit(true, true, true, true);
    //     emit MockVerification.AIVerificationSubmitted(0, true);
    //     vm.prank(oracleProvider);
    //     oracle.submitOracleResult(0, true, 95);

    //     (bool approved, uint8 confidenceScore, address provider) = oracle.oracleResults(0);
    //     assertTrue(approved, "Result should be approved");
    //     assertEq(confidenceScore, 95, "Confidence score should match");
    //     assertEq(provider, oracleProvider, "Provider address should match");
    // }

    // RENAMED FUNCTION
    function testRevertIf_CallerIsNotOracleProvider() public {
        vm.expectRevert(bytes("Caller is not a trusted oracle provider."));
        vm.prank(randomUser);
        oracle.submitOracleResult(0, true, 95);
    }
}