import { NextResponse } from "next/server";
import dbConnect from "../../../lib/db";
import Underwriting from "../../../models/Underwriting";

interface UnderwriteRequest {
  name: string; // Frontend sends "name", not "farmerName"
  documentId: string;
  region: string;
  cropType: string;
  requestedAmount: number;
  tenorMonths: number;
  hectares: number;
  historicalYieldTonsPerHectare: number;
  coopMember: boolean;
}

interface UnderwriteResponse {
  riskTier: "A" | "B" | "C" | "D";
  riskBand: string;
  rate: number;
  maxCreditLimit: number;
  confidence: number;
  flags: string[];
  explanation: string;
}

function mapRiskTier(input: UnderwriteRequest): UnderwriteResponse["riskTier"] {
  const { coopMember, requestedAmount, historicalYieldTonsPerHectare } = input;

  if (
    coopMember &&
    historicalYieldTonsPerHectare >= 3.5 &&
    requestedAmount <= 800_000
  ) {
    return "A";
  }

  if (historicalYieldTonsPerHectare >= 2.5 && requestedAmount <= 1_200_000) {
    return "B";
  }

  if (requestedAmount > 1_500_000 || historicalYieldTonsPerHectare < 1.8) {
    return "D";
  }

  return "C";
}

function riskBandForTier(tier: UnderwriteResponse["riskTier"]): string {
  switch (tier) {
    case "A":
      return "A–BBB";
    case "B":
      return "BB–B";
    case "C":
      return "B–CCC";
    case "D":
      return "CCC–C";
    default:
      return "Unspecified";
  }
}

function rateForTier(tier: UnderwriteResponse["riskTier"]): number {
  switch (tier) {
    case "A":
      return 0.12;
    case "B":
      return 0.16;
    case "C":
      return 0.19;
    case "D":
      return 0.23;
    default:
      return 0.18;
  }
}

function performAiAnalysis(payload: UnderwriteRequest): UnderwriteResponse {
  const riskTier = mapRiskTier(payload);
  const riskBand = riskBandForTier(riskTier);
  const rate = rateForTier(riskTier);

  const maxCreditLimit =
    payload.requestedAmount *
    (riskTier === "A" ? 1.4 : riskTier === "B" ? 1.25 : 1.1);

  const confidenceBase =
    riskTier === "A" ? 0.8 : riskTier === "B" ? 0.75 : 0.65;
  const confidence = Math.min(
    0.95,
    confidenceBase +
      (payload.coopMember ? 0.05 : 0) +
      (payload.historicalYieldTonsPerHectare > 3 ? 0.03 : 0)
  );

  const flags: string[] = [];
  if (payload.requestedAmount > 1_200_000) {
    flags.push("Large single-borrower concentration");
  }
  if (!payload.coopMember) {
    flags.push("No coop anchor; assess buyer diversification");
  }

  const explanation = [
    `Rayls scored this farmer as tier ${riskTier} in band ${riskBand}.`,
    `Requested USD ${payload.requestedAmount.toLocaleString("en-US")} at ${
      payload.tenorMonths
    } months.`,
    payload.coopMember
      ? "Coop membership and historical yield support a higher credit limit."
      : "Absence of coop backing slightly tightens the credit box.",
  ].join(" ");

  return {
    riskTier,
    riskBand,
    rate,
    maxCreditLimit,
    confidence,
    flags,
    explanation,
  };
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const body: UnderwriteRequest = await request.json();

    // Validate basic presence
    if (!body.name || !body.documentId) {
      return NextResponse.json(
        { error: "Missing required fields: name and documentId are required" },
        { status: 400 }
      );
    }

    // AI Analysis - the function only uses coopMember, requestedAmount, and historicalYieldTonsPerHectare
    const aiResult = performAiAnalysis(body);

    // Create record - map "name" to "farmerName" for database
    const underwritingDoc = {
      farmerName: body.name,
      documentId: body.documentId,
      region: body.region,
      cropType: body.cropType,
      financials: {
        requestedAmount: body.requestedAmount,
        hectares: body.hectares,
        yield: body.historicalYieldTonsPerHectare,
      },
      aiAnalysis: {
        riskScore: aiResult.confidence * 100, // Mapping confidence to 0-100 score
        riskTier: aiResult.riskTier,
        maxCreditLimit: aiResult.maxCreditLimit,
        explanation: aiResult.explanation,
      },
      status: "PENDING",
    };

    const savedDoc = await Underwriting.create(underwritingDoc);

    return NextResponse.json({
      data: savedDoc,
      aiAnalysis: aiResult,
    });
  } catch (error: any) {
    console.error("Underwriting error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
