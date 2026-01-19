// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

// --- Interfaces ---
interface IMRVRegistry {
    enum VerificationStatus { Submitted, AIVerified, AdminVerified, SurvivalVerified, Disputed, Rejected }
    function updateVerificationStatus(uint256 _plantationId, VerificationStatus _newStatus) external;
    function getPlantationUploader(uint256 _plantationId) external view returns (address);
}

interface IStakeReputation {
    function slashStake(address _ngo) external;
    function decreaseReputation(address _ngo) external;
}

/**
 * @title Verification (Complete & Upgraded)
 * @dev Handles secure, time-stamped, multi-level verification logic.
 */
contract Verification is Ownable {
    //=========== State ===========
    address public adminAddress;
    address public scoreOracleAddress;
    IMRVRegistry public mrvRegistry;
    IStakeReputation public stakeReputation;

    struct VerificationRecord {
        bool adminVerified;
        bool aiVerified;
        uint256 peerConfirmations;
        uint8 survivalPredictionScore;
        uint256 adminVerificationTimestamp;
    }

    mapping(uint256 => mapping(address => bool)) public hasPeerVerified;
    mapping(uint256 => VerificationRecord) public verificationRecords;
    uint256 public peerVerificationThreshold = 3;

    // --- Events ---
    event AdminVerification(uint256 indexed plantationId, bool approved);
    event AIVerification(uint256 indexed plantationId, bool approved, uint8 score);
    event PeerVerification(uint256 indexed plantationId, address indexed verifier);
    event SubmissionFaked(uint256 indexed plantationId, address indexed uploader);
    
    // --- Modifiers ---
    modifier onlyAdmin() { require(msg.sender == adminAddress, "Not the authorized admin"); _; }
    modifier onlyScoreOracle() { require(msg.sender == scoreOracleAddress, "Caller is not the authorized score oracle"); _; }
    
    constructor(
        address _registryAddress,
        address _stakeReputationAddress,
        address _initialAdmin,
        address _weatherAddress
    ) Ownable(msg.sender) {
        adminAddress = _initialAdmin;
        scoreOracleAddress = _weatherAddress;
        mrvRegistry = IMRVRegistry(_registryAddress);
        stakeReputation = IStakeReputation(_stakeReputationAddress);
    }

    //=========== Core Verification Functions ===========

    function submitAdminVerification(uint256 _plantationId, bool _approved) external onlyAdmin {
        verificationRecords[_plantationId].adminVerified = _approved;
        if (_approved) {
            verificationRecords[_plantationId].adminVerificationTimestamp = block.timestamp;
            mrvRegistry.updateVerificationStatus(_plantationId, IMRVRegistry.VerificationStatus.AdminVerified);
        } else {
            flagFakeSubmission(_plantationId);
        }
        emit AdminVerification(_plantationId, _approved);
    }

    function submitAIScore(uint256 _projectId, uint8 _score) external onlyScoreOracle {
        verificationRecords[_projectId].survivalPredictionScore = _score;
        verificationRecords[_projectId].aiVerified = true;
        mrvRegistry.updateVerificationStatus(_projectId, IMRVRegistry.VerificationStatus.AIVerified);
        emit AIVerification(_projectId, true, _score);
    }
    
    function flagProjectAsDisputed(uint256 _projectId, uint8 _score) external onlyScoreOracle {
        verificationRecords[_projectId].survivalPredictionScore = _score;
        verificationRecords[_projectId].aiVerified = false;
        mrvRegistry.updateVerificationStatus(_projectId, IMRVRegistry.VerificationStatus.Disputed);
        emit AIVerification(_projectId, false, _score);
    }

    function submitPeerVerification(uint256 _plantationId) external {
        require(!hasPeerVerified[_plantationId][msg.sender], "Already verified");
        hasPeerVerified[_plantationId][msg.sender] = true;
        verificationRecords[_plantationId].peerConfirmations++;
        emit PeerVerification(_plantationId, msg.sender);
    }

    // --- THIS FUNCTION NOW HAS ITS FULL BODY ---
    function flagFakeSubmission(uint256 _plantationId) public onlyAdmin {
        mrvRegistry.updateVerificationStatus(_plantationId, IMRVRegistry.VerificationStatus.Rejected);
        
        address uploader = mrvRegistry.getPlantationUploader(_plantationId);
        
        stakeReputation.slashStake(uploader);
        stakeReputation.decreaseReputation(uploader);

        emit SubmissionFaked(_plantationId, uploader);
    }
    
    // --- THESE FUNCTIONS NOW HAVE THEIR FULL BODIES ---
    function getVerificationRecord(uint256 _plantationId) external view returns (VerificationRecord memory) {
        return verificationRecords[_plantationId];
    }

    function setAdminAddress(address _newAdminAddress) external onlyOwner {
        adminAddress = _newAdminAddress;
    }

    function setScoreOracleAddress(address _newOracleAddress) external onlyOwner {
        scoreOracleAddress = _newOracleAddress;
    }
}

