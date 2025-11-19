import type { Farmer, LoanNote, Vault } from "./schemas";

export const mockVaults: Vault[] = [
  {
    id: "cerrado-igpm-a",
    name: "Cerrado IGPM – Tier A",
    riskBand: "A–BBB",
    cropTypes: ["Soy", "Corn"],
    baseApr: 0.12,
    tvl: 3_500_000,
    description:
      "Multi-farmer IGPM-linked vault focused on large-scale soy and corn producers in the Brazilian Cerrado.",
  },
  {
    id: "sul- diversified-b",
    name: "Sul Diversified – Tier B",
    riskBand: "BB–B",
    cropTypes: ["Soy", "Corn", "Coffee"],
    baseApr: 0.17,
    tvl: 1_800_000,
    description:
      "Diversified pool across mid-sized farmers in Rio Grande do Sul and Paraná with mixed crop exposure.",
  },
  {
    id: "coffee-premium-a",
    name: "Coffee Premium – Tier A",
    riskBand: "A–BBB",
    cropTypes: ["Coffee"],
    baseApr: 0.145,
    tvl: 2_200_000,
    description:
      "Specialty coffee-focused vault with export-linked buyers and strong coop anchors.",
  },
];

export const mockFarmers: Farmer[] = [
  {
    id: "farmer-1",
    name: "Fazenda Primavera",
    region: "Mato Grosso",
    cropType: "Soy",
    riskTier: "A",
    maxCreditLimit: 750_000,
    metadataURI: "https://example.com/metadata/fazenda-primavera",
  },
  {
    id: "farmer-2",
    name: "Sítio São Jorge",
    region: "Paraná",
    cropType: "Corn",
    riskTier: "B",
    maxCreditLimit: 350_000,
    metadataURI: "https://example.com/metadata/sitio-sao-jorge",
  },
];

export const mockNotes: LoanNote[] = [
  {
    id: "note-1",
    farmerId: "farmer-1",
    vaultId: "cerrado-igpm-a",
    principal: 500_000,
    tenorMonths: 12,
    rate: 0.13,
    outstanding: 420_000,
    status: "Active",
  },
  {
    id: "note-2",
    farmerId: "farmer-2",
    vaultId: "sul- diversified-b",
    principal: 250_000,
    tenorMonths: 9,
    rate: 0.18,
    outstanding: 230_000,
    status: "Active",
  },
];


