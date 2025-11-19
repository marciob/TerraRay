// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AgroTypes} from "./AgroTypes.sol";

/// @title FarmerNote
/// @notice ERC-721 token representing individual loan exposures.
/// @dev Notes are minted and managed by whitelisted vaults.
contract FarmerNote is ERC721, Ownable {
    using AgroTypes for AgroTypes.NoteData;

    uint256 private _nextId = 1;
    mapping(uint256 => AgroTypes.NoteData) private _notes;
    mapping(address => bool) public isVault;

    event VaultPermissionUpdated(address indexed vault, bool allowed);
    event NoteMinted(uint256 indexed noteId, AgroTypes.NoteData data);
    event NoteStatusUpdated(uint256 indexed noteId, AgroTypes.NoteStatus status);

    constructor(address initialOwner)
        ERC721("FarmerNote", "FNOTE")
        Ownable(initialOwner)
    {}

    modifier onlyVault() {
        require(isVault[msg.sender], "FarmerNote: caller not vault");
        _;
    }

    modifier onlyNoteVault(uint256 noteId) {
        require(_notes[noteId].vault == msg.sender, "FarmerNote: not note vault");
        _;
    }

    function setVault(address vault, bool allowed) external onlyOwner {
        require(vault != address(0), "FarmerNote: zero address");
        isVault[vault] = allowed;
        emit VaultPermissionUpdated(vault, allowed);
    }

    /// @notice Mint a new loan note for a farmer.
    /// @param to The address that will hold the note (typically the vault).
    function mintNote(
        address to,
        address farmer,
        uint256 principal,
        uint256 interestRateBps,
        uint256 maturityTimestamp
    ) external onlyVault returns (uint256) {
        require(to != address(0), "FarmerNote: zero to");
        require(farmer != address(0), "FarmerNote: zero farmer");
        require(principal > 0, "FarmerNote: zero principal");

        uint256 noteId = _nextId;
        _nextId = noteId + 1;

        AgroTypes.NoteData storage data = _notes[noteId];
        data.farmer = farmer;
        data.principal = principal;
        data.interestRateBps = interestRateBps;
        data.maturityTimestamp = maturityTimestamp;
        data.status = AgroTypes.NoteStatus.ACTIVE;
        data.vault = msg.sender;

        _mint(to, noteId);
        emit NoteMinted(noteId, data);
        return noteId;
    }

    function setStatusRepaid(uint256 noteId) external onlyNoteVault(noteId) {
        _setStatus(noteId, AgroTypes.NoteStatus.REPAID);
    }

    function setStatusDefaulted(uint256 noteId) external onlyNoteVault(noteId) {
        _setStatus(noteId, AgroTypes.NoteStatus.DEFAULTED);
    }

    function getNote(
        uint256 noteId
    ) external view returns (AgroTypes.NoteData memory) {
        return _notes[noteId];
    }

    function _setStatus(uint256 noteId, AgroTypes.NoteStatus status) internal {
        AgroTypes.NoteData storage data = _notes[noteId];
        require(data.farmer != address(0), "FarmerNote: unknown note");
        data.status = status;
        emit NoteStatusUpdated(noteId, status);
    }
}


