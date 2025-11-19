import { NextRequest, NextResponse } from "next/server";
import { verifyProof } from "@semaphore-protocol/proof";
import type { SemaphoreProof } from "@semaphore-protocol/proof";
import {
  generateAccessToken,
  recordNullifier,
  hasUsedNullifier,
} from "@/app/lib/access-verification";

// Cache for recent roots (in production, fetch from contract)
const recentRoots = new Set<string>([
  // Add your group's merkle roots here
]);

interface VerifyAccessRequest {
  proof: SemaphoreProof;
  scope: string;
}

/**
 * API endpoint to verify Semaphore access proofs
 * POST /api/verify-access
 */
export async function POST(req: NextRequest) {
  try {
    const body: VerifyAccessRequest = await req.json();
    const { proof, scope } = body;

    if (!proof || !scope) {
      return NextResponse.json(
        { error: "Missing proof or scope" },
        { status: 400 }
      );
    }

    // 1. Verify the proof cryptographically
    const isValidProof = await verifyProof(proof);
    if (!isValidProof) {
      return NextResponse.json(
        { error: "Invalid proof" },
        { status: 403 }
      );
    }

    // 2. Check if nullifier has been used
    const nullifierStr = proof.nullifier.toString();
    if (hasUsedNullifier(nullifierStr)) {
      return NextResponse.json(
        { error: "Proof already used (nullifier collision)" },
        { status: 403 }
      );
    }

    // 3. Verify the scope matches what was proven
    // The scope should match the scope used in proof generation
    if (proof.scope?.toString() !== scope) {
      return NextResponse.json(
        { error: "Scope mismatch" },
        { status: 403 }
      );
    }

    // 4. Verify merkle root is current or recent (optional but recommended)
    // This prevents using proofs from old group states
    /*
    const rootStr = proof.merkleTreeRoot.toString();
    if (!recentRoots.has(rootStr)) {
      return NextResponse.json(
        { error: "Merkle root too old or invalid" },
        { status: 403 }
      );
    }
    */

    // 5. Record nullifier usage
    recordNullifier(nullifierStr);

    // Return success with access token (could be JWT)
    return NextResponse.json({
      success: true,
      message: "Access granted",
      accessToken: generateAccessToken(proof.nullifier),
    });
  } catch (error: any) {
    console.error("Proof verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

