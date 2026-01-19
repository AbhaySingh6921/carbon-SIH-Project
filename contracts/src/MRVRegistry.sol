// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./CarbonCredit.sol"; // Assuming CarbonCredit.sol is in the same folder

/**
 * @title MRVRegistry
 * @dev This contract is the central registry for all blue carbon plantation projects.
 * It stores plantation data, tracks verification status, and triggers the minting
 * 
 * of carbon credits upon successful verification.
 */

interface INGOManager {
    function isWhitelisted(address _ngoAddress) external view returns (bool);
}
contract MRVRegistry is Ownable {
    //===========
    // State Variables
    //===========

    // Reference to the CarbonCredit token contract
    CarbonCredit public carbonCreditToken;
       address public verificationContractAddress;

    // A custom data type to store all info about a plantation
    struct Plantation {
        uint256 id;
        address uploader; // Address of the NGO that submitted the data
        string species;
        uint256 treeCount;
        string ipfsHash; // Hash of photos, videos, and reports on IPFS
        VerificationStatus status;
        bool creditsIssued;
        string description;
        string latitude;
        string longitude;
    }

    // An enum for clear and readable status tracking
    enum VerificationStatus {
        Submitted,
        AIVerified,
        AdminVerified,
        SurvivalVerified,
        Disputed,
        Rejected
    }
    modifier onlyVerificationContract() {
        require(msg.sender == verificationContractAddress, "Caller is not the authorized Verification contract");
        _;
    }
    // --- NEW: Address of the trusted NGOManager contract ---
    INGOManager public ngoManager;

   // --- NEW: Modifier to protect the submit function ---
    modifier onlyWhitelistedNGO() {
        require(ngoManager.isWhitelisted(msg.sender), "Caller is not a whitelisted NGO");
        _;
    }

    // This function can only be called by the OWNER of this contract
    function setVerificationContract(address _newAddress) external onlyOwner {
        verificationContractAddress = _newAddress;
    }
    // A counter to ensure each plantation gets a unique ID
    uint256 private _plantationIdCounter;

    // Mapping from a plantation ID to its data struct
    mapping(uint256 => Plantation) public plantations;

    // Mapping to track all plantations submitted by a specific address
    mapping(address => uint256[]) private _plantationsByUploader;

    //===========
    // Events
    //===========

    event PlantationRegistered(uint256 indexed plantationId, address indexed uploader);
    event VerificationStatusUpdated(uint256 indexed plantationId, VerificationStatus newStatus);
    event CreditsAssigned(uint256 indexed plantationId, address indexed beneficiary, uint256 amount);
    event PlantationDisputed(uint256 indexed plantationId, address indexed disputer);

    //===========
    // Constructor
    //===========

    constructor(address _carbonCreditTokenAddress) Ownable(msg.sender) {
        carbonCreditToken = CarbonCredit(_carbonCreditTokenAddress);
    }

    //===========
    // Core Functions
    //===========

    /**
     * @dev Adds a new plantation submission to the registry.
     * Called by an NGO after they have staked their tokens.
     */
    function registerPlantation(
        string memory _species,
        uint256 _treeCount,
        string memory _initialIpfsHash,
        string memory _description,
        string memory _latitude,
        string memory _longitude
    ) external onlyWhitelistedNGO{
        uint256 plantationId = _plantationIdCounter;
        
        plantations[plantationId] = Plantation({
            id: plantationId,
            uploader: msg.sender,
            species: _species,
            treeCount: _treeCount,
            ipfsHash: _initialIpfsHash,
            status: VerificationStatus.Submitted,
            creditsIssued: false,
            description: _description,
            latitude: _latitude,
            longitude: _longitude
        });

        _plantationsByUploader[msg.sender].push(plantationId);
        _plantationIdCounter++;

        emit PlantationRegistered(plantationId, msg.sender);
    }

    /**
     * @dev Updates the verification status of a plantation.
     * Restricted to the owner (or eventually, a dedicated Verification contract).
     */
    function updateVerificationStatus(
        uint256 _plantationId,
        VerificationStatus _newStatus
    ) public  onlyVerificationContract {
        require(_plantationId < _plantationIdCounter, "Plantation does not exist.");
        plantations[_plantationId].status = _newStatus;
        emit VerificationStatusUpdated(_plantationId, _newStatus);
    }

    /**
     * @dev Updates the IPFS hash for a plantation, e.g., to add a verification report.
     * Restricted to the owner.
     */
    function recordIPFSHash(uint256 _plantationId, string memory _newIpfsHash) external onlyOwner {
        require(_plantationId < _plantationIdCounter, "Plantation does not exist.");
        plantations[_plantationId].ipfsHash = _newIpfsHash;
    }
 
    /**
     * @dev Triggers the minting of carbon credits for a verified plantation.
     * Assumes 1 tree = 1 credit for simplicity.
     * This function is a placeholder for the `linkToCarbonCredit` logic.
     */
    function assignCredits(uint256 _plantationId) external onlyOwner {
        Plantation storage p = plantations[_plantationId];
        require(_plantationId < _plantationIdCounter, "Plantation does not exist.");
        require(p.status == VerificationStatus.SurvivalVerified, "Plantation not fully verified.");
        require(!p.creditsIssued, "Credits already issued for this plantation.");

        p.creditsIssued = true;
        uint256 amountToMint = p.treeCount; // Simple logic: 1 tree = 1 credit

        carbonCreditToken.mint(p.uploader, amountToMint);
        emit CreditsAssigned(_plantationId, p.uploader, amountToMint);
    }

    /**
     * @dev Marks a plantation as having passed its periodic survival check.
     * This is a specific instance of updating the status.
     */
    function markSurvivalVerified(uint256 _plantationId) external onlyOwner {
        updateVerificationStatus(_plantationId, VerificationStatus.SurvivalVerified);
    }

    /**
     * @dev Marks a submission for review if it's flagged as suspicious.
     */
    function disputePlantation(uint256 _plantationId) external onlyOwner {
        updateVerificationStatus(_plantationId, VerificationStatus.Disputed);
        emit PlantationDisputed(_plantationId, msg.sender);
    }

    //===========
    // View Functions
    //===========

    /**
     * @dev Fetches all details of a single plantation.
     * Note: The `public` visibility on the `plantations` mapping automatically creates this getter.
     * This function is here for explicit clarity.
     */
    function getPlantation(uint256 _plantationId) external view returns (Plantation memory) {
        require(_plantationId < _plantationIdCounter, "Plantation does not exist.");
        return plantations[_plantationId];
    }

    /**
     * @dev Fetches a list of all plantation IDs submitted by an NGO.
     */
    function getPlantationsByUploader(address _uploader) external view returns (uint256[] memory) {
        return _plantationsByUploader[_uploader];
    }

    /**
     * @dev Returns the total number of plantations ever registered.
     */
    function totalPlantations() external view returns (uint256) {
        return _plantationIdCounter;
    }
    function getPlantationUploader(uint256 _plantationId) external view returns (address) {
        require(_plantationId < _plantationIdCounter, "Plantation does not exist.");
        return plantations[_plantationId].uploader;
    }
    // --- NEW: Function for the owner to set the manager address after deployment ---
    function setNGOManager(address _managerAddress) external onlyOwner {
        ngoManager = INGOManager(_managerAddress);
    }
}