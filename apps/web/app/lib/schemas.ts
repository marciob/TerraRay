import { z } from "zod";

export const farmerRiskTiers = ["A", "B", "C", "D"] as const;
export type FarmerRiskTier = (typeof farmerRiskTiers)[number];

export const cropTypes = ["Soy", "Corn", "Coffee", "Sugarcane", "Mixed"] as const;
export type CropType = (typeof cropTypes)[number];

export const regions = [
  "Mato Grosso",
  "Paraná",
  "Rio Grande do Sul",
  "Bahia",
  "Goías",
] as const;
export type Region = (typeof regions)[number];

// ---------- Underwriting ----------

export const UnderwriteRequestSchema = z.object({
  name: z.string().min(2),
  documentId: z.string().min(5),
  region: z.enum(regions),
  cropType: z.enum(cropTypes),
  requestedAmount: z.number().positive(),
  tenorMonths: z.number().int().min(3).max(36),
  hectares: z.number().positive(),
  historicalYieldTonsPerHectare: z.number().positive(),
  coopMember: z.boolean(),
});

export type UnderwriteRequest = z.infer<typeof UnderwriteRequestSchema>;

export const UnderwriteResponseSchema = z.object({
  riskTier: z.enum(farmerRiskTiers),
  riskBand: z.string(),
  rate: z.number(),
  maxCreditLimit: z.number(),
  confidence: z.number().min(0).max(1),
  flags: z.array(z.string()),
  explanation: z.string(),
});

export type UnderwriteResponse = z.infer<typeof UnderwriteResponseSchema>;

// ---------- Core domain entities ----------

export const FarmerSchema = z.object({
  id: z.string(),
  name: z.string(),
  region: z.enum(regions),
  cropType: z.enum(cropTypes),
  riskTier: z.enum(farmerRiskTiers),
  maxCreditLimit: z.number(),
  metadataURI: z.string().url().optional(),
});

export type Farmer = z.infer<typeof FarmerSchema>;

export const VaultSchema = z.object({
  id: z.string(),
  name: z.string(),
  riskBand: z.string(),
  cropTypes: z.array(z.enum(cropTypes)),
  baseApr: z.number(),
  tvl: z.number(),
  description: z.string(),
});

export type Vault = z.infer<typeof VaultSchema>;

export const NoteStatusSchema = z.enum(["Active", "Repaid", "Late"]);
export type NoteStatus = z.infer<typeof NoteStatusSchema>;

export const LoanNoteSchema = z.object({
  id: z.string(),
  farmerId: z.string(),
  vaultId: z.string(),
  principal: z.number(),
  tenorMonths: z.number(),
  rate: z.number(),
  outstanding: z.number(),
  status: NoteStatusSchema,
});

export type LoanNote = z.infer<typeof LoanNoteSchema>;

// ---------- UI flow contracts ----------

export const LoanCreationSchema = z.object({
  farmerId: z.string().min(1),
  vaultId: z.string().min(1),
  principal: z.number().positive(),
  tenorMonths: z.number().int().min(3).max(36),
});

export type LoanCreationPayload = z.infer<typeof LoanCreationSchema>;

export const DepositSchema = z.object({
  vaultId: z.string().min(1),
  amount: z.number().positive(),
});

export type DepositPayload = z.infer<typeof DepositSchema>;

export const RepaymentSchema = z.object({
  noteId: z.string().min(1),
  amount: z.number().positive(),
});

export type RepaymentPayload = z.infer<typeof RepaymentSchema>;


