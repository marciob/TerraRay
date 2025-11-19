// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AgroTypes} from "./AgroTypes.sol";

/// @title FarmerRegistry
/// @notice Authoritative on-chain whitelist for farmers and their public risk data.
/// @dev Enumerable: tracks all registered farmers for frontend queries.
contract FarmerRegistry is Ownable {
    using AgroTypes for AgroTypes.FarmerData;

    mapping(address => AgroTypes.FarmerData) private _farmers;
    address[] private _farmerList;
    mapping(address => uint256) private _farmerIndex; // 1-based index (0 = not registered)
    uint256 public approvedFarmerCount;

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

        bool isNewFarmer = _farmerIndex[farmer] == 0;
        bool wasApproved = _farmers[farmer].approved;

        AgroTypes.FarmerData storage data = _farmers[farmer];
        data.approved = approved;
        data.riskTier = riskTier;
        data.cropType = cropType;
        data.region = region;
        data.metadataURI = metadataURI;

        // Add to enumerable list if new
        if (isNewFarmer) {
            _farmerList.push(farmer);
            _farmerIndex[farmer] = _farmerList.length; // 1-based
        }

        // Update approved count
        if (approved && !wasApproved) {
            approvedFarmerCount++;
        } else if (!approved && wasApproved) {
            approvedFarmerCount--;
        }

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

    /// @notice Get total number of registered farmers (approved + not approved).
    function getFarmerCount() external view returns (uint256) {
        return _farmerList.length;
    }

    /// @notice Get a paginated list of farmer addresses.
    /// @param offset Starting index (0-based).
    /// @param limit Maximum number of results to return.
    function getFarmers(
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory) {
        uint256 total = _farmerList.length;
        if (offset >= total) {
            return new address[](0);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256 resultLength = end - offset;
        address[] memory result = new address[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = _farmerList[offset + i];
        }

        return result;
    }

    /// @notice Get a farmer by index (0-based).
    function getFarmerAt(uint256 index) external view returns (address) {
        require(index < _farmerList.length, "FarmerRegistry: index out of bounds");
        return _farmerList[index];
    }
}
