// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Shared enums and structs for the TerraRay protocol
/// @dev Keep in sync with ARCHITECTURE.md and frontend/TS enums.
library AgroTypes {
    /// @notice Discrete risk tiers, lower = lower risk.
    /// 1: Prime / very low risk
    /// 2: Low risk
    /// 3: Medium risk
    /// 4: Higher risk
    /// 5: High / frontier risk
    enum RiskTier {
        UNUSED,
        TIER1,
        TIER2,
        TIER3,
        TIER4,
        TIER5
    }

    /// @notice Crop type classification.
    /// 0: UNKNOWN, 1: SOY, 2: CORN, 3: COFFEE, 4: FRUITS, 5: SPECIALTY, 6: OTHER
    enum CropType {
        UNKNOWN,
        SOY,
        CORN,
        COFFEE,
        FRUITS,
        SPECIALTY,
        OTHER
    }

    /// @notice Coarse region classification.
    /// 0: UNKNOWN, 1: NORTH, 2: NORTHEAST, 3: CENTRAL, 4: SOUTHEAST, 5: SOUTH
    enum Region {
        UNKNOWN,
        NORTH,
        NORTHEAST,
        CENTRAL,
        SOUTHEAST,
        SOUTH
    }

    /// @notice Farmer metadata stored on-chain.
    struct FarmerData {
        bool approved;
        uint8 riskTier; // 1–5
        CropType cropType;
        Region region;
        string metadataURI;
    }

    /// @notice Status of a FarmerNote.
    enum NoteStatus {
        NONE,
        ACTIVE,
        REPAID,
        DEFAULTED
    }

    /// @notice Data associated with a loan note.
    struct NoteData {
        address farmer;
        uint256 principal;
        uint256 interestRateBps;
        uint256 maturityTimestamp;
        NoteStatus status;
        address vault;
    }
}


