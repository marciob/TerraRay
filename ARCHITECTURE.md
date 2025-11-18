## Architecture Overview

This document captures the current domain model and high-level architecture for
the Rayls-based AgroCredit / TerraRay protocol. It is the **source of truth**
for vault strategies, on-chain vs off-chain responsibilities, and the
underwriting service contract.

This file **must be updated** whenever the domain model or interfaces change.

## Vault Strategies (MVP)

AgroVaults are ERC-4626 vaults parameterized by:

- **riskTierMin**: minimum allowed farmer risk tier (inclusive).
- **riskTierMax**: maximum allowed farmer risk tier (inclusive).
- **allowedCropTypes**: list of allowed crop types; empty list means "any crop type".

The MVP ships with three predefined vault strategies:

### Soy & Corn Prime Vault

- **Crop types**: `soy`, `corn`
- **Risk tiers**: 1–3
- **Narrative**: conservative grains exposure, export-friendly.

### Coffee & Specialty Crops Yield Vault

- **Crop types**: `coffee`, `fruits`, `specialty`
- **Risk tiers**: 2–4
- **Narrative**: higher-margin crops, moderate risk.

### LatAm Mixed Crop High Yield

- **Crop types**: any (i.e. `allowedCropTypes` is empty)
- **Risk tiers**: 3–5
- **Narrative**: diversified LatAm ag exposure with a clear yield tilt.

## Enums and Value Conventions

The following enums and numeric conventions are **canonical** and must be kept
identical in Solidity and TypeScript.

### RiskTier (1–5)

Discrete risk tiers used on-chain and in the underwriting output:

- `1`: **Prime / very low risk**
- `2`: **Low risk**
- `3`: **Medium risk**
- `4`: **Higher risk**
- `5`: **High / frontier risk**

Any logic that relies on ordering should treat a lower number as **lower risk**.

### CropType enum

`CropType` is encoded as a `uint8` on-chain and as a numeric enum in TypeScript:

- `0`: `UNKNOWN`
- `1`: `SOY`
- `2`: `CORN`
- `3`: `COFFEE`
- `4`: `FRUITS`
- `5`: `SPECIALTY`
- `6`: `OTHER`

**"Any" crop type in vaults**:

- For `AgroVault`, `allowedCropTypes` is:
  - An array of `CropType` values; **empty array** means:
    - "Accept any crop type where `cropType != UNKNOWN`."
  - Non-empty `allowedCropTypes` means:
    - "Accept only farmers whose `cropType` is in `allowedCropTypes`."

### Region enum

`Region` is encoded as a `uint8` on-chain and as a numeric enum in TypeScript:

- `0`: `UNKNOWN`
- `1`: `NORTH`
- `2`: `NORTHEAST`
- `3`: `CENTRAL`
- `4`: `SOUTHEAST`
- `5`: `SOUTH`

These are intentionally coarse-grained to preserve privacy while conveying
useful geographic diversification information.

### Units and Numeric Conventions

To avoid ambiguity and floating point issues, all monetary and rate fields are
defined precisely:

- **Principal and maxCreditLimit**
  - All amounts (e.g. `principal` on `FarmerNote`, `maxCreditLimit` from
    underwriting) are:
  - `uint256` in **ERC-20 smallest units**, aligned with the vault's stablecoin
    decimals (e.g. 6 decimals for USDC-style tokens, 18 for others).
  - **Not** BRL cents.

- **suggestedAnnualRateBps**
  - Annual interest rate in **basis points per year**.
  - Example: `1450` = 14.50% APR.
  - Stored as an integer (e.g. `uint256`/`uint32`), never as a float.

## On-chain vs Off-chain Responsibilities

The design is privacy-first and aligned with Rayls' institutional and
compliance focus. Sensitive farmer and underwriting data stays off-chain, while
the public chain holds aggregated and risk-tiered information only.

### On-chain (Rayls Public Chain)

- **FarmerRegistry**
  - **Fields**:
    - `farmerAddress`: address
    - `approved`: `bool`
    - `riskTier`: `uint8` (1–5)
    - `cropType`: enum (e.g. `SOY`, `CORN`, `COFFEE`, `FRUITS`, `SPECIALTY`, `OTHER`)
    - `region`: enum (e.g. `NORTH`, `SOUTH`, `CENTRAL`, `NORTHEAST`, `SOUTHEAST`)
    - `metadataURI`: string/bytes (points to off-chain data, e.g. IPFS or private store)
  - **Role**: authoritative whitelist of onboarded farmers and their public risk
    tiering and classification.

- **FarmerNote (ERC-721 loan token)**
  - **Fields (per note/token)**:
    - `farmer`: address (reference into `FarmerRegistry`)
    - `principal`: uint (stablecoin-denominated principal amount)
    - `interestRateBps`: uint (annualized interest rate in basis points)
    - `maturityTimestamp`: uint (UNIX timestamp)
    - `status`: enum (`ACTIVE`, `REPAID`, `DEFAULTED`)
  - **Role**: represents individual loan exposures. Minted when a vault funds a
    loan, held by the vault.

- **AgroVault (ERC-4626)**
  - **Fields / parameters (per vault instance)**:
    - `asset`: stablecoin address (ERC-20)
    - `riskTierMin`: `uint8`
    - `riskTierMax`: `uint8`
    - `allowedCropTypes`: array of crop type enums (empty = any)
  - **Core behavior**:
    - **Deposits/withdrawals**: follow ERC-4626 standard, gated by
      `InvestorWhitelist`.
    - **Loan funding**: vault allocates capital into `FarmerNote` positions
      subject to `riskTier` and `cropType` constraints.
    - **Repayments**: repayments flow back into the vault, updating NAV.
  - **TVL definition**:
    - `totalAssets()` is defined as:
      - \[
        \text{totalAssets} = \text{stablecoinBalance} + \text{outstandingPrincipal}
        \]
      - where:
        - `stablecoinBalance`: current on-chain stablecoin balance held by the vault.
        - `outstandingPrincipal`: sum of principal for all `ACTIVE` notes held by the vault.

- **InvestorWhitelist**
  - **Interface (conceptual)**:
    - `isWhitelisted(address investor) -> bool`
  - **Role**: simple KYC / access-control layer. AgroVault deposits and
    potentially some admin actions are gated so only whitelisted,
    compliance-checked investors can participate.

### Off-chain (Bank / Co-op / Private Rayls Side)

- **Data held off-chain**:
  - Farmer legal identity and documentation (KYC/KYB).
  - GPS/location, land-use data.
  - Financial statements and historical collections data.
  - Monitoring data (satellite imagery, IoT devices, in-person visits).
  - Detailed underwriting models, parameters, and full explanations.

- **Responsibilities**:
  - Run AI underwriting and risk analysis.
  - Maintain detailed loan servicing and monitoring records.
  - Decide final loan terms within risk and policy constraints before pushing
    parameters on-chain.

## Underwriting Service (`POST /underwrite`)

An off-chain underwriting service exposes a strict JSON API used by operators
to evaluate loan requests before creating on-chain `FarmerNote`s and funding
via `AgroVault`s.

### Request (conceptual, not yet finalized)

The request contains detailed farmer and loan proposal data (region, crop,
farm size, experience, historical production, requested amount, tenor, etc.).
Exact shape will be defined alongside the backend implementation.

### Response (fixed contract)

The `POST /underwrite` endpoint returns the following JSON object:

- **riskTier**: `number` (1–5)
  - Discrete risk tier used on-chain and in `FarmerRegistry`.
- **riskScore**: `number`
  - Continuous risk score (e.g. in the range \[0, 1\] or \[0, 100\]); used off-chain
    for more granular analysis. The exact scale will be documented with the
    backend implementation.
- **riskBand**: `string`
  - Human-readable band label (e.g. `"AAA" | "AA" | "A" | "BBB" | ..."`).
- **suggestedAnnualRateBps**: `number`
  - Suggested annual interest rate in basis points (e.g. `1450` = 14.50%/year).
- **maxCreditLimit**: `string`
  - Maximum recommended credit exposure for this farmer, represented as a
    stringified integer (e.g. smallest units or BRL cents) to avoid floating
    point issues.
- **confidence**: `number`
  - Model confidence score in the range \[0, 1\].
- **flags**: `string[]`
  - List of machine-readable flags, e.g. `"concentration_risk_medium"`,
    `"limited_history"`, `"volatility_high"`.
- **explanation**: `string`
  - Short natural-language rationale suitable for human operators and
    institutional risk teams.

### On-chain Consumption of Underwriting Output

From the underwriting response, only a **subset** is ever written on-chain:

- **Used on-chain**:
  - `riskTier`
  - `suggestedAnnualRateBps` (or a human-reviewed, final tuned rate)
  - Optionally `maxCreditLimit` (as a constraint, enforced by off-chain
    workflow and/or on-chain checks).

- **Kept off-chain**:
  - `riskScore`
  - `riskBand`
  - `confidence`
  - `flags`
  - `explanation`

These off-chain fields are surfaced in the UI and internal risk dashboards but
are not stored on the public chain, aligning with Rayls' privacy and
institutional focus.


