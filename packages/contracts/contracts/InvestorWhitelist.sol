// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title InvestorWhitelist
/// @notice Simple ownable whitelist used to gate vault deposits (and optionally other actions).
contract InvestorWhitelist is Ownable {
    mapping(address => bool) private _whitelisted;

    event InvestorAdded(address indexed investor);
    event InvestorRemoved(address indexed investor);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @notice Add an investor to the whitelist.
    function addInvestor(address investor) external onlyOwner {
        require(investor != address(0), "InvestorWhitelist: zero address");
        if (_whitelisted[investor]) {
            return;
        }
        _whitelisted[investor] = true;
        emit InvestorAdded(investor);
    }

    /// @notice Remove an investor from the whitelist.
    function removeInvestor(address investor) external onlyOwner {
        if (!_whitelisted[investor]) {
            return;
        }
        _whitelisted[investor] = false;
        emit InvestorRemoved(investor);
    }

    /// @notice Check if an address is whitelisted.
    function isWhitelisted(address investor) external view returns (bool) {
        return _whitelisted[investor];
    }
}


