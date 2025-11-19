🌱 TerraRay – Contracts Package

Bridging Institutional Capital to Brazilian Agriculture on Rayls.

TerraRay is a compliant, institutional-grade credit platform that connects global liquidity with high-yield Brazilian agricultural assets. By combining ERC-4626 Vaults for capital efficiency, AI-driven underwriting, and the privacy features of the Rayls ecosystem, we solve the credit gap for local farmers while offering banks transparent, diversified yield exposure.

### 🚀 The Problem vs. The Solution

**The Gap**: Brazilian farmers drive one of the world's most productive agricultural engines but suffer from a lack of credit due to bureaucracy and collateral complexity. At the same time, institutional investors want exposure to these high yields but lack the tools to access them compliantly and efficiently.

**The TerraRay Solution**: A unified platform where:

- **Farmers** are scored by AI and tokenized as `FarmerNotes` (ERC-721).
- **Investors (Banks/Funds)** deposit stablecoins into diversified `AgroVaults` (ERC-4626).
- **Rayls Chain** ensures transparency of risk tiers while keeping sensitive farmer PII private.

### 🏗 Architecture & Tech Focus of This Package

TerraRay leverages a hybrid architecture to ensure compliance and scalability.  
This `@packages/contracts` package contains the **on-chain smart contracts and types** that power the protocol.

#### 1. On-Chain (Rayls EVM)

- **`AgroVault` (ERC-4626)**: Core pooling mechanism. Investors fund strategies (e.g., "Soybean High Yield") rather than individual loans.
- **`FarmerNote` (ERC-721)**: Represents loan principal, interest rate, and maturity. Typically held by the vault.
- **`FarmerRegistry`**: On-chain whitelist that stores approved farmer profiles and risk tiers, using data minimization patterns for privacy.
- **`InvestorWhitelist`**: Ensures only KYC'd addresses can interact with vaults and other restricted protocol surfaces.

All contracts are designed to be **modular, auditable, and composable**, with clear boundaries between access control, accounting, and configuration.

#### 2. Off-Chain (AI & Privacy – Context)

While not implemented in this package, the contracts are built to integrate cleanly with off-chain services:

- **AI Underwriting**: Backend services analyze farmer data (region, crop history, financials) and output deterministic risk scores and credit limits that map into on-chain risk tiers.
- **Data Privacy**: Raw farmer data remains off-chain, protecting bank proprietary models and farmer privacy. Only the minimal required signals (e.g., risk tier, eligibility flags) are reflected on-chain.

### 📂 What Lives in This Package

- **Core protocol contracts**: `FarmerRegistry`, `FarmerNote`, `AgroVault`, `InvestorWhitelist`, and related utilities.
- **ABIs and TypeScript bindings**: Generated TypeChain types for safe integration from apps and services.
- **Deployment and configuration helpers**: Scripts and utilities (where applicable) for deploying and wiring vaults, registries, and whitelists.

This package is the **single source of truth for protocol-level contracts** used across the TerraRay stack. Implementation details and architecture may evolve during the hackathon, but the public interfaces here define how other apps and services safely integrate with TerraRay on Rayls.
