"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { Identity } from "@semaphore-protocol/identity";
import type { SemaphoreProof } from "@semaphore-protocol/proof";
import {
  createSemaphoreIdentity,
  storeIdentity,
  loadStoredIdentity,
  generateAccessProof,
  fetchGroupMembers,
  hasStoredIdentity,
  clearIdentity,
  type AccessScope,
} from "../semaphore-utils";

interface UseSemaphoreAccessReturn {
  identity: Identity | null;
  isAuthorized: boolean;
  isLoading: boolean;
  error: string | null;
  generateIdentity: () => Promise<void>;
  generateProof: (scope: AccessScope) => Promise<SemaphoreProof | null>;
  logout: () => void;
}

/**
 * Hook for managing Semaphore-based access control
 */
export function useSemaphoreAccess(): UseSemaphoreAccessReturn {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load existing identity on mount
  useEffect(() => {
    if (!isConnected) {
      setIdentity(null);
      setIsAuthorized(false);
      setIsLoading(false);
      return;
    }

    const loadIdentity = async () => {
      setIsLoading(true);
      try {
        const stored = loadStoredIdentity();
        if (stored) {
          setIdentity(stored);
          
          // Check if user is in the authorized group
          // In production, verify against contract
          const isInGroup = await checkGroupMembership(stored);
          setIsAuthorized(isInGroup);
        }
      } catch (err) {
        console.error("Failed to load identity:", err);
        setError("Failed to load identity");
      } finally {
        setIsLoading(false);
      }
    };

    loadIdentity();
  }, [isConnected]);

  // Generate new identity
  const generateIdentity = useCallback(async () => {
    if (!isConnected || !address) {
      setError("Wallet not connected");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newIdentity = await createSemaphoreIdentity(signMessageAsync);
      setIdentity(newIdentity);
      storeIdentity(newIdentity);
      
      // Check authorization
      const isInGroup = await checkGroupMembership(newIdentity);
      setIsAuthorized(isInGroup);
      
      if (!isInGroup) {
        setError("Your identity is not in the authorized viewers group. Please contact an administrator.");
      }
    } catch (err: any) {
      console.error("Failed to generate identity:", err);
      setError(err.message || "Failed to generate identity");
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, signMessageAsync]);

  // Generate proof for specific scope
  const generateProof = useCallback(
    async (scope: AccessScope): Promise<SemaphoreProof | null> => {
      if (!identity || !address || !isAuthorized) {
        setError("Not authorized or identity not generated");
        return null;
      }

      try {
        // Fetch current group members
        // TODO: Replace with actual contract address and group ID
        const members = await fetchGroupMembers(
          "0x0000000000000000000000000000000000000000",
          1
        );
        
        const proof = await generateAccessProof(
          identity,
          members,
          scope,
          address
        );
        
        return proof;
      } catch (err: any) {
        console.error("Failed to generate proof:", err);
        setError(err.message || "Failed to generate proof");
        return null;
      }
    },
    [identity, address, isAuthorized]
  );

  // Logout / clear identity
  const logout = useCallback(() => {
    clearIdentity();
    setIdentity(null);
    setIsAuthorized(false);
    setError(null);
  }, []);

  return {
    identity,
    isAuthorized,
    isLoading,
    error,
    generateIdentity,
    generateProof,
    logout,
  };
}

/**
 * Check if identity is in the authorized group
 * In production, verify against on-chain group
 */
async function checkGroupMembership(identity: Identity): Promise<boolean> {
  // TODO: Implement actual on-chain check
  // For now, return true for demo purposes
  console.log("Checking group membership for commitment:", identity.commitment);
  
  // Mock implementation - replace with actual contract call
  try {
    const members = await fetchGroupMembers(
      "0x0000000000000000000000000000000000000000",
      1
    );
    return members.some((member) => member === identity.commitment);
  } catch (error) {
    console.error("Failed to check group membership:", error);
    return false;
  }
}

