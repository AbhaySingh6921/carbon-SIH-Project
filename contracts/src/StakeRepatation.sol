// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title StakeReputation
 * @dev Manages NGO staking, stake slashing, and reputation scores.
 * This contract holds the economic incentives that secure the MRV system.
 */
contract StakeReputation is Ownable {
    //===========
    // State Variables
    //===========

    IERC20 public stakingToken;
    address public verificationContract;

    mapping(address => uint256) public stakedAmount;
    mapping(address => uint256) public reputationScore;

    uint256 public minimumStake = 5 * 10**18; // Example: 5 tokens with 18 decimals
    uint256 public penaltyRate = 25; // Example: 25% of stake is slashed
    uint256 public reputationReward = 10;
    uint256 public reputationPenalty = 20;

    //===========
    // Events
    //===========

    event Staked(address indexed ngo, uint256 amount);
    event Withdrawn(address indexed ngo, uint256 amount);
    event StakeSlashed(address indexed ngo, uint256 amount);
    event ReputationUpdated(address indexed ngo, uint256 newScore);

    //===========
    // Modifiers
    //===========

    modifier onlyVerificationContract() {
        require(msg.sender == verificationContract, "Only the verification contract can call this.");
        _;
    }

    //===========
    // Constructor
    //===========

    constructor(address _stakingTokenAddress) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingTokenAddress);
    }

    //===========
    // Staking Functions (for NGOs)
    //===========

    /**
     * @dev Allows an NGO to stake tokens.
     * The NGO must first approve this contract to spend their tokens.
     */
    function stakeTokens(uint256 _amount) external {
        require(_amount >= minimumStake, "Amount is less than minimum stake.");
        
        stakedAmount[msg.sender] += _amount;
        
        // Securely pull the approved tokens from the user to this contract
        bool success = stakingToken.transferFrom(msg.sender, address(this), _amount);
        require(success, "Token transfer failed.");
        
        emit Staked(msg.sender, _amount);
    }

    /**
     * @dev Allows an NGO to withdraw their staked tokens.
     */
    function withdrawStake(uint256 _amount) external {
        require(_amount <= stakedAmount[msg.sender], "Insufficient staked amount.");
        // Note: A real system would add a check here to ensure the NGO has no pending
        // or active plantations before allowing withdrawal.

        stakedAmount[msg.sender] -= _amount;
        
        bool success = stakingToken.transfer(msg.sender, _amount);
        require(success, "Token transfer failed.");

        emit Withdrawn(msg.sender, _amount);
    }

    //===========
    // Reputation & Slashing (for Verification Contract)
    //===========

    /**
     * @dev Slashes a portion of a penalized NGO's stake.
     * Can only be called by the trusted Verification contract.
     */
    function slashStake(address _ngo) external onlyVerificationContract {
        uint256 currentStake = stakedAmount[_ngo];
        require(currentStake > 0, "No stake to slash.");

        uint256 slashAmount = (currentStake * penaltyRate) / 100;
        stakedAmount[_ngo] -= slashAmount;

        // The slashed tokens are kept in this contract as a treasury.
        emit StakeSlashed(_ngo, slashAmount);
    }

    /**
     * @dev Increases an NGO's reputation score for a successful verification.
     */
    function increaseReputation(address _ngo) external onlyVerificationContract {
        reputationScore[_ngo] += reputationReward;
        emit ReputationUpdated(_ngo, reputationScore[_ngo]);
    }

    /**
     * @dev Decreases an NGO's reputation score for a fake/rejected submission.
     */
    function decreaseReputation(address _ngo) external onlyVerificationContract {
        uint256 currentScore = reputationScore[_ngo];
        if (currentScore >= reputationPenalty) {
            reputationScore[_ngo] -= reputationPenalty;
        } else {
            reputationScore[_ngo] = 0;
        }
        emit ReputationUpdated(_ngo, reputationScore[_ngo]);
    }
    
    //===========
    // Configuration (for Owner)
    //===========

    /**
     * @dev Sets the address of the trusted Verification contract.
     */
    function setVerificationContract(address _address) external onlyOwner {
        verificationContract = _address;
    }

    function setMinimumStake(uint256 _amount) external onlyOwner {
        minimumStake = _amount;
    }

    function setPenaltyRate(uint256 _rate) external onlyOwner {
        require(_rate <= 100, "Rate cannot exceed 100.");
        penaltyRate = _rate;
    }
}