// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20, IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {InvestorWhitelist} from "./InvestorWhitelist.sol";
import {FarmerRegistry} from "./FarmerRegistry.sol";
import {FarmerNote} from "./FarmerNote.sol";
import {AgroTypes} from "./AgroTypes.sol";

/// @title AgroVault
/// @notice ERC-4626 vault that allocates capital into FarmerNotes subject to risk and crop constraints.
contract AgroVault is ERC4626, Ownable, ReentrancyGuard {
    using AgroTypes for AgroTypes.FarmerData;

    InvestorWhitelist public immutable investorWhitelist;
    FarmerRegistry public immutable farmerRegistry;
    FarmerNote public immutable farmerNote;

    uint8 public immutable riskTierMin;
    uint8 public immutable riskTierMax;
    bool public immutable anyCropTypeAllowed;

    mapping(AgroTypes.CropType => bool) public isAllowedCropType;
    mapping(uint256 => uint256) public noteOutstandingPrincipal;
    uint256 public totalOutstandingPrincipal;

    event NoteFunded(
        uint256 indexed noteId,
        address indexed farmer,
        uint256 principal,
        uint256 interestRateBps,
        uint256 maturityTimestamp,
        address recipient
    );

    event NoteRepaymentRecorded(
        uint256 indexed noteId,
        uint256 amount,
        uint256 principalReduction
    );

    constructor(
        IERC20Metadata asset_,
        InvestorWhitelist investorWhitelist_,
        FarmerRegistry farmerRegistry_,
        FarmerNote farmerNote_,
        uint8 riskTierMin_,
        uint8 riskTierMax_,
        AgroTypes.CropType[] memory allowedCropTypes_,
        string memory name_,
        string memory symbol_,
        address initialOwner
    ) ERC20(name_, symbol_) ERC4626(asset_) Ownable(initialOwner) {
        require(
            address(investorWhitelist_) != address(0),
            "AgroVault: whitelist zero"
        );
        require(
            address(farmerRegistry_) != address(0),
            "AgroVault: registry zero"
        );
        require(address(farmerNote_) != address(0), "AgroVault: note zero");
        require(
            riskTierMin_ >= 1 && riskTierMin_ <= 5,
            "AgroVault: bad min tier"
        );
        require(
            riskTierMax_ >= riskTierMin_ && riskTierMax_ <= 5,
            "AgroVault: bad max tier"
        );

        investorWhitelist = investorWhitelist_;
        farmerRegistry = farmerRegistry_;
        farmerNote = farmerNote_;
        riskTierMin = riskTierMin_;
        riskTierMax = riskTierMax_;

        bool anyAllowed = allowedCropTypes_.length == 0;
        anyCropTypeAllowed = anyAllowed;
        if (!anyAllowed) {
            for (uint256 i = 0; i < allowedCropTypes_.length; i++) {
                AgroTypes.CropType ct = allowedCropTypes_[i];
                isAllowedCropType[ct] = true;
            }
        }
    }

    /// @inheritdoc ERC4626
    function deposit(
        uint256 assets,
        address receiver
    ) public override nonReentrant returns (uint256) {
        require(
            investorWhitelist.isWhitelisted(receiver),
            "AgroVault: receiver not whitelisted"
        );
        return super.deposit(assets, receiver);
    }

    /// @inheritdoc ERC4626
    function mint(
        uint256 shares,
        address receiver
    ) public override nonReentrant returns (uint256) {
        require(
            investorWhitelist.isWhitelisted(receiver),
            "AgroVault: receiver not whitelisted"
        );
        return super.mint(shares, receiver);
    }

    /// @notice Fund a new loan note for an approved farmer.
    function fundNote(
        address farmer,
        uint256 principal,
        uint256 interestRateBps,
        uint256 maturityTimestamp,
        address recipient
    ) external nonReentrant onlyOwner returns (uint256 noteId) {
        require(farmer != address(0), "AgroVault: zero farmer");
        require(recipient != address(0), "AgroVault: zero recipient");
        require(principal > 0, "AgroVault: zero principal");

        AgroTypes.FarmerData memory data = farmerRegistry.getFarmer(farmer);
        require(data.approved, "AgroVault: farmer not approved");
        require(
            data.riskTier >= riskTierMin && data.riskTier <= riskTierMax,
            "AgroVault: risk tier out of range"
        );

        if (!anyCropTypeAllowed) {
            require(
                isAllowedCropType[data.cropType],
                "AgroVault: crop type not allowed"
            );
        } else {
            require(
                data.cropType != AgroTypes.CropType.UNKNOWN,
                "AgroVault: unknown crop"
            );
        }

        IERC20 assetToken = IERC20(asset());
        uint256 balance = assetToken.balanceOf(address(this));
        require(balance >= principal, "AgroVault: insufficient liquidity");

        // Transfer principal to farmer/recipient.
        assetToken.transfer(recipient, principal);

        // Mint note to the vault itself.
        noteId = farmerNote.mintNote(
            address(this),
            farmer,
            principal,
            interestRateBps,
            maturityTimestamp
        );

        noteOutstandingPrincipal[noteId] = principal;
        totalOutstandingPrincipal += principal;

        emit NoteFunded(
            noteId,
            farmer,
            principal,
            interestRateBps,
            maturityTimestamp,
            recipient
        );
    }

    /// @notice Record a repayment for a note.
    /// @dev Caller (farmer/repayer) must have approved this vault to transfer `amount`.
    function recordRepayment(
        uint256 noteId,
        uint256 amount
    ) external nonReentrant {
        require(amount > 0, "AgroVault: zero amount");

        uint256 outstanding = noteOutstandingPrincipal[noteId];
        require(outstanding > 0, "AgroVault: no outstanding");

        IERC20(asset()).transferFrom(msg.sender, address(this), amount);

        uint256 principalReduction = amount > outstanding
            ? outstanding
            : amount;
        uint256 newOutstanding = outstanding - principalReduction;
        noteOutstandingPrincipal[noteId] = newOutstanding;
        totalOutstandingPrincipal -= principalReduction;

        if (newOutstanding == 0) {
            farmerNote.setStatusRepaid(noteId);
        }

        emit NoteRepaymentRecorded(noteId, amount, principalReduction);
    }

    /// @inheritdoc ERC4626
    function totalAssets() public view override returns (uint256) {
        return
            IERC20(asset()).balanceOf(address(this)) +
            totalOutstandingPrincipal;
    }

    /// @dev Decimals offset to prevent inflation attacks (as per docs/contracts/erc4626.txt).
    function _decimalsOffset() internal view virtual override returns (uint8) {
        return 9;
    }
}
