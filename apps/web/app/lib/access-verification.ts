import { NextRequest } from "next/server";

// In-memory store for used nullifiers (in production, use Redis or database)
const usedNullifiers = new Set<string>();

/**
 * Middleware to verify access token on protected routes
 * Usage: add to your API routes that need protection
 */
export async function verifyAccessToken(req: NextRequest): Promise<boolean> {
  const token = req.headers.get("x-access-token");
  
  if (!token) {
    return false;
  }
  
  try {
    const payload = JSON.parse(Buffer.from(token, "base64").toString());
    
    // Check expiry
    if (payload.expiresAt < Date.now()) {
      return false;
    }
    
    // Check nullifier is still valid
    if (!usedNullifiers.has(payload.nullifier)) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Generate a short-lived access token
 * In production, use proper JWT with expiry
 */
export function generateAccessToken(nullifier: string | bigint): string {
  // Simple token for demo - use proper JWT in production
  const payload = {
    nullifier: nullifier.toString(),
    timestamp: Date.now(),
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
  };
  
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

/**
 * Record a nullifier as used
 */
export function recordNullifier(nullifier: string): void {
  usedNullifiers.add(nullifier);
  
  // Clean up old nullifiers after 1 hour (in production, use proper cleanup)
  setTimeout(() => {
    usedNullifiers.delete(nullifier);
  }, 60 * 60 * 1000);
}

/**
 * Check if nullifier has been used
 */
export function hasUsedNullifier(nullifier: string): boolean {
  return usedNullifiers.has(nullifier);
}

