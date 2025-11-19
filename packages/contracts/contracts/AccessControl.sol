// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title AccessControl
/// @notice Manages authorized viewers (operators and banks) who can access sensitive farmer data
/// @dev Integrates with Semaphore protocol for ZK-based access control
contract AccessControl is Ownable {
    // Semaphore group ID for authorized viewers
    uint256 public authorizedViewersGroupId;
    
    // Semaphore contract address
    address public semaphoreAddress;
    
    // Mapping of nullifiers that have been used (to prevent replay attacks)
    mapping(uint256 => bool) public usedNullifiers;
    
    // Events
    event SemaphoreConfigured(address semaphoreAddress, uint256 groupId);
    event AccessGranted(uint256 indexed nullifier, bytes32 dataHash);
    event AccessRevoked(address indexed viewer);
    
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    /// @notice Configure Semaphore integration
    /// @param _semaphoreAddress Address of deployed Semaphore.sol contract
    /// @param _groupId Group ID for authorized viewers
    function configureSemaphore(
        address _semaphoreAddress,
        uint256 _groupId
    ) external onlyOwner {
        require(_semaphoreAddress != address(0), "AccessControl: zero address");
        semaphoreAddress = _semaphoreAddress;
        authorizedViewersGroupId = _groupId;
        emit SemaphoreConfigured(_semaphoreAddress, _groupId);
    }
    
    /// @notice Check if a viewer has used their nullifier for this scope
    /// @param nullifier The nullifier from the ZK proof
    function hasUsedNullifier(uint256 nullifier) external view returns (bool) {
        return usedNullifiers[nullifier];
    }
    
    /// @notice Mark a nullifier as used (called after successful verification)
    /// @param nullifier The nullifier to mark as used
    /// @param dataHash Hash of the data being accessed
    function recordAccess(
        uint256 nullifier,
        bytes32 dataHash
    ) external onlyOwner {
        usedNullifiers[nullifier] = true;
        emit AccessGranted(nullifier, dataHash);
    }
}

