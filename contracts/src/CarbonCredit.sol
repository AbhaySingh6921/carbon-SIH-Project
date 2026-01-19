// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CarbonCredit
 * @dev ERC20 token representing one tonne of verified blue carbon credit.
 * The owner (which will be our MRVRegistry contract) has the sole authority
 * to mint new tokens upon successful project verification.
 */
contract CarbonCredit is ERC20, Ownable {
    constructor() ERC20("Blue Carbon Credit", "BCC") Ownable(msg.sender) {}

    /**
     * @dev Creates `amount` new tokens and assigns them to the `to` address.
     * This function can only be called by the contract's owner.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}