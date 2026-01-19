// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NGOManager
 * @dev Manages the registration, status, and data of all participating NGOs.
 */
contract NGOManager is Ownable {
    
    enum NGOStatus { Pending, Whitelisted, Blacklisted }

    struct NGO {
        address walletAddress;
        string name;
        string country;
        NGOStatus status;
        uint256 registrationDate;
        bool exists;
    }

    // Mapping from an NGO's address to their data
    mapping(address => NGO) public ngos;
    
    // An array to easily retrieve all registered NGO addresses
    address[] public ngoList;

    event NGORegistered(address indexed ngoAddress, string name, string country);
    event NGOStatusChanged(address indexed ngoAddress, NGOStatus newStatus);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Allows the owner to whitelist a new NGO.
     * @param _ngoAddress The wallet address of the NGO.
     * @param _name The official name of the organization.
     * @param _country The country of operation.
     */
    function whitelistNGO(address _ngoAddress, string memory _name, string memory _country) external onlyOwner {
        require(!ngos[_ngoAddress].exists, "NGO already registered.");
        
        ngos[_ngoAddress] = NGO({
            walletAddress: _ngoAddress,
            name: _name,
            country: _country,
            status: NGOStatus.Whitelisted,
            registrationDate: block.timestamp,
            exists: true
        });

        ngoList.push(_ngoAddress);
        emit NGORegistered(_ngoAddress, _name, _country);
    }

    /**
     * @notice Allows the owner to change the status of an existing NGO (e.g., to blacklist).
     * @param _ngoAddress The address of the NGO to update.
     * @param _newStatus The new status (Whitelisted or Blacklisted).
     */
    function setNGOStatus(address _ngoAddress, NGOStatus _newStatus) external onlyOwner {
        require(ngos[_ngoAddress].exists, "NGO not found.");
        ngos[_ngoAddress].status = _newStatus;
        emit NGOStatusChanged(_ngoAddress, _newStatus);
    }

    /**
     * @notice A public view function to check if an NGO is currently active and allowed to submit projects.
     * @param _ngoAddress The address to check.
     */
    function isWhitelisted(address _ngoAddress) external view returns (bool) {
        return ngos[_ngoAddress].exists && ngos[_ngoAddress].status == NGOStatus.Whitelisted;
    }

    /**
     * @notice Returns the total number of registered NGOs.
     */
    function getNGOCount() external view returns (uint256) {
        return ngoList.length;
    }
}
