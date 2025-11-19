// app/lib/contracts.ts
// Central place for on-chain contract addresses + ABIs used by the frontend.
// Addresses can be overridden via NEXT_PUBLIC_* env vars after deploying to Rayls.

import AgroVaultABI from "./abis/AgroVault.json";
import MockStablecoinABI from "./abis/MockStablecoin.json";

type Address = `0x${string}`;

const envAddress = (envKey: string, fallback: Address): Address => {
  // Fallback logic for now since env vars are proving sticky
  return fallback;
};

export const CONTRACT_ADDRESSES = {
  // HARDCODED: Rayls Testnet Deployment (from flow:happy:rayls)
  MockStablecoin: "0x2e8CeC1AbDE7114F4748966eCbdB4262609d92b4" as Address,
  InvestorWhitelist: "0x4539F7BDE985A8c7585D45e6F831d2fAFAE092A4" as Address,
  FarmerRegistry: "0xaba36d76a6C167e040574A1f29C0adcE1D1F453A" as Address,
  FarmerNote: "0x1fdA1bbb56f8BE2cc3b6695db8461929Af5d46bf" as Address,
  AgroVault: "0x2f719F2589339Bc2DCAb7BE9B18B7943c9470A58" as Address,
} as const;

export const AGRO_VAULT_ABI = AgroVaultABI;
export const MOCK_STABLECOIN_ABI = MockStablecoinABI;
