// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AgroTypes} from "./AgroTypes.sol";

/// @title FarmerRegistry
/// @notice Authoritative on-chain whitelist for farmers and their public risk data.
contract FarmerRegistry is Ownable {
    using AgroTypes for AgroTypes.FarmerData;

    mapping(address => AgroTypes.FarmerData) private _farmers;

    event FarmerRegistered(address indexed farmer, AgroTypes.FarmerData data);
    event FarmerUpdated(address indexed farmer, AgroTypes.FarmerData data);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @notice Register or update a farmer's on-chain profile.
    /// @dev Only callable by the operator/owner.
    function registerOrUpdateFarmer(
        address farmer,
        bool approved,
        uint8 riskTier,
        AgroTypes.CropType cropType,
        AgroTypes.Region region,
        string calldata metadataURI
    ) external onlyOwner {
        require(farmer != address(0), "FarmerRegistry: zero address");
        require(riskTier >= 1 && riskTier <= 5, "FarmerRegistry: invalid risk tier");

        AgroTypes.FarmerData storage data = _farmers[farmer];
        data.approved = approved;
        data.riskTier = riskTier;
        data.cropType = cropType;
        data.region = region;
        data.metadataURI = metadataURI;

        if (approved) {
            emit FarmerRegistered(farmer, data);
        } else {
            emit FarmerUpdated(farmer, data);
        }
    }

    /// @notice Get a farmer's data.
    function getFarmer(
        address farmer
    ) external view returns (AgroTypes.FarmerData memory) {
        return _farmers[farmer];
    }
}


