// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title CreditPassport
/// @notice Soulbound Token (SBT) representing a farmer's credit scorecard.
/// @dev Non-transferable NFT that stores credit metadata URI.
contract CreditPassport is ERC721, Ownable {
    uint256 private _nextTokenId = 1;
    
    mapping(uint256 => string) private _tokenMetadata;
    mapping(address => uint256) private _farmerToTokenId;
    
    event PassportMinted(
        uint256 indexed tokenId,
        address indexed farmer,
        string metadataURI
    );
    
    event MetadataUpdated(
        uint256 indexed tokenId,
        string newMetadataURI
    );

    constructor(address initialOwner)
        ERC721("Credit Passport", "CPASS")
        Ownable(initialOwner)
    {}

    /// @notice Mint a new credit passport for a farmer.
    /// @dev Each farmer can only have one passport.
    function mintPassport(
        address farmer,
        string calldata metadataURI
    ) external onlyOwner returns (uint256) {
        require(farmer != address(0), "CreditPassport: zero address");
        require(
            _farmerToTokenId[farmer] == 0,
            "CreditPassport: farmer already has passport"
        );
        require(bytes(metadataURI).length > 0, "CreditPassport: empty metadata");

        uint256 tokenId = _nextTokenId;
        _nextTokenId = tokenId + 1;

        _mint(farmer, tokenId);
        _tokenMetadata[tokenId] = metadataURI;
        _farmerToTokenId[farmer] = tokenId;

        emit PassportMinted(tokenId, farmer, metadataURI);
        return tokenId;
    }

    /// @notice Update the metadata URI for an existing passport.
    function updateMetadata(
        uint256 tokenId,
        string calldata newMetadataURI
    ) external onlyOwner {
        require(ownerOf(tokenId) != address(0), "CreditPassport: nonexistent token");
        require(bytes(newMetadataURI).length > 0, "CreditPassport: empty metadata");

        _tokenMetadata[tokenId] = newMetadataURI;
        emit MetadataUpdated(tokenId, newMetadataURI);
    }

    /// @notice Get the token ID for a given farmer address.
    function getTokenIdByFarmer(address farmer) external view returns (uint256) {
        return _farmerToTokenId[farmer];
    }

    /// @notice Get the metadata URI for a token.
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "CreditPassport: nonexistent token");
        return _tokenMetadata[tokenId];
    }

    /// @notice Burn a passport token.
    /// @dev Only owner can burn tokens.
    function burn(uint256 tokenId) external onlyOwner {
        _burn(tokenId);
    }

    /// @dev Override transfer functions to make tokens soulbound (non-transferable).
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0))
        // Block all transfers (from != 0 && to != 0)
        // Note: Burning via _burn() sets to = address(0), which is allowed
        if (from != address(0) && to != address(0)) {
            revert("CreditPassport: token is soulbound");
        }

        return super._update(to, tokenId, auth);
    }
}

