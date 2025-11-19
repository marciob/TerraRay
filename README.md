## TerraRay – On‑Chain Agro Credit Platform

TerraRay is a credit platform where KYC’d banks and funds finance diversified pools of Brazilian farmers via ERC‑4626 multi‑farmer vaults, combining AI‑driven underwriting and on‑chain loan tokens for transparent, compliant, institution‑ready agricultural credit with a realistic path to real TVL through integrations with local agri‑coops and banks.

- **Apps**
  - `apps/web` – Next.js 16 dApp for investors, operators, and farmers (wagmi + RainbowKit, OpenAI‑powered vault AI summaries).
- **Contracts**
  - `packages/contracts` – Hardhat project with AgroVault, FarmerRegistry, FarmerNote, CreditPassport, and related Rayls integrations.
- **Shared**
  - `packages/shared` – Shared TypeScript utilities and types.

### Getting started

```bash
pnpm install           # install all workspace dependencies
pnpm dev --filter web  # run the Next.js app on localhost
```

Set any required environment variables in `apps/web/.env.local` (see `apps/web/README.md` and `packages/contracts/README.md` for details).
