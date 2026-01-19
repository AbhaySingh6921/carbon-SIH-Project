// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

// Interface to interact with the Verification contract
interface IVerification {
    function submitAIVerification(uint256 _plantationId, bool _approved) external;
}

/**
 * @title VerificationOracle
 * @dev Manages a list of trusted oracle providers and accepts verification
 * results from them (e.g., from an AI/drone analysis).
 */
contract VerificationOracle is Ownable {
    //===========
    // State Variables
    //===========

    IVerification public verificationContract;

    // A whitelist of addresses that are authorized to submit data
    mapping(address => bool) public isOracleProvider;

    // Optional: Store the results submitted by oracles
    struct OracleResult {
        bool approved;
        uint8 confidenceScore; // e.g., A score from 0-100
        address provider;
    }
    mapping(uint256 => OracleResult) public oracleResults;

    //===========
    // Events
    //===========

    event OracleProviderSet(address indexed provider, bool isTrusted);
    event OracleResultSubmitted(uint256 indexed plantationId, address indexed provider, bool approved);

    //===========
    // Modifiers
    //===========

    modifier onlyOracleProvider() {
        require(isOracleProvider[msg.sender], "Caller is not a trusted oracle provider.");
        _;
    }

    //===========
    // Constructor
    //===========

    constructor(address _verificationContractAddress) Ownable(msg.sender) {
        verificationContract = IVerification(_verificationContractAddress);
    }

    //===========
    // Core Functions
    //===========

    /**
     * @dev Called by a trusted oracle to submit their verification result.
     * This result is then pushed to the main Verification contract.
     */
    function submitOracleResult(
        uint256 _plantationId,
        bool _approved,
        uint8 _confidenceScore
    ) external onlyOracleProvider {
        require(_confidenceScore <= 100, "Confidence must be between 0 and 100.");
        
        // Store the result within this contract for record-keeping
        oracleResults[_plantationId] = OracleResult({
            approved: _approved,
            confidenceScore: _confidenceScore,
            provider: msg.sender
        });

        // Pass the result to the main Verification contract
        verificationContract.submitAIVerification(_plantationId, _approved);

        emit OracleResultSubmitted(_plantationId, msg.sender, _approved);
    }

    //===========
    // Provider Management (for Owner)
    //===========

    /**
     * @dev Allows the owner to add or remove a trusted oracle provider.
     */
    function setOracleProvider(address _provider, bool _isTrusted) external onlyOwner {
        isOracleProvider[_provider] = _isTrusted;
        emit OracleProviderSet(_provider, _isTrusted);
    }

    //===========
    // View Functions
    //===========

    /**
     * @dev Fetches the oracle result for a given plantation.
     * Note: The public mapping `oracleResults` already creates this getter.
     * This function is here for explicit clarity.
     */
    function getOracleResult(uint256 _plantationId) external view returns (OracleResult memory) {
        return oracleResults[_plantationId];
    }
}