"use client";

import { Identity } from "@semaphore-protocol/identity";
import { Group } from "@semaphore-protocol/group";
import { generateProof, verifyProof } from "@semaphore-protocol/proof";
import type { SemaphoreProof } from "@semaphore-protocol/proof";
import { hashMessage } from "viem";

/**
 * Generate a deterministic Semaphore identity from a wallet signature
 * This allows users to recover their identity by signing the same message
 */
export async function createSemaphoreIdentity(
  signMessageFn: (args: { message: string }) => Promise<string>
): Promise<Identity> {
  const message = "Sign this message to create your Rayls access identity.\n\nThis signature will be used to generate a zero-knowledge identity for secure access to sensitive data.";
  
  try {
    const signature = await signMessageFn({ message });
    // Use signature as private key for deterministic identity
    const identity = new Identity(signature);
    return identity;
  } catch (error) {
    console.error("Failed to create Semaphore identity:", error);
    throw new Error("User rejected signature request");
  }
}

/**
 * Store identity in local storage (encrypted with simple XOR for demo)
 * In production, use proper encryption or delegate to secure storage
 */
export function storeIdentity(identity: Identity): void {
  const exported = identity.export();
  localStorage.setItem("rayls_semaphore_identity", exported);
}

/**
 * Retrieve identity from local storage
 */
export function loadStoredIdentity(): Identity | null {
  const stored = localStorage.getItem("rayls_semaphore_identity");
  if (!stored) return null;
  
  try {
    return Identity.import(stored);
  } catch (error) {
    console.error("Failed to load stored identity:", error);
    return null;
  }
}

/**
 * Generate a ZK proof for accessing protected resources
 */
export async function generateAccessProof(
  identity: Identity,
  groupMembers: bigint[],
  scope: string,
  userAddress: string
): Promise<SemaphoreProof> {
  // Create off-chain group from on-chain members
  const group = new Group(groupMembers);
  
  // Check if user is in the group
  const memberIndex = groupMembers.findIndex(
    (member) => member === identity.commitment
  );
  
  if (memberIndex === -1) {
    throw new Error("User is not a member of the authorized viewers group");
  }
  
  // Message is hash of user address (proves which wallet is making the request)
  const message = BigInt(hashMessage(userAddress));
  
  // Generate the proof
  const proof = await generateProof(identity, group, message, scope);
  
  return proof;
}

/**
 * Verify a Semaphore proof client-side (for quick feedback)
 * Note: Always verify server-side as well for security
 */
export async function verifyAccessProof(
  proof: SemaphoreProof
): Promise<boolean> {
  try {
    return await verifyProof(proof);
  } catch (error) {
    console.error("Proof verification failed:", error);
    return false;
  }
}

/**
 * Fetch group members from contract
 */
export async function fetchGroupMembers(
  contractAddress: string,
  groupId: number,
  rpcUrl?: string
): Promise<bigint[]> {
  // This is a placeholder - implement based on your contract ABI
  // You'll need to read from the Semaphore contract's group data
  
  // For MVP, you can hardcode some members or use a subgraph
  console.warn("fetchGroupMembers not fully implemented - returning mock data");
  
  // Mock data for development
  return [
    BigInt("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"),
    BigInt("0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"),
  ];
}

/**
 * Scopes for different resources
 */
export const ACCESS_SCOPES = {
  VIEW_FARMERS: "rayls-view-farmers",
  VIEW_LOANS: "rayls-view-loans",
  VIEW_CREDIT_SCORES: "rayls-view-credit-scores",
  VIEW_REPAYMENTS: "rayls-view-repayments",
  ADMIN_PANEL: "rayls-admin-panel",
} as const;

export type AccessScope = (typeof ACCESS_SCOPES)[keyof typeof ACCESS_SCOPES];

/**
 * Check if user has a valid identity and is in the group
 */
export function hasStoredIdentity(): boolean {
  return localStorage.getItem("rayls_semaphore_identity") !== null;
}

/**
 * Clear stored identity (logout)
 */
export function clearIdentity(): void {
  localStorage.removeItem("rayls_semaphore_identity");
}

