"use client";

/**
 * Example of a protected page using Semaphore ZK access control
 * This page wraps the sensitive content with ProtectedRoute
 */

import { useState, useEffect } from "react";
import { Shield, Users, AlertCircle } from "lucide-react";
import { ProtectedRoute } from "@/app/components/auth/ProtectedRoute";
import { ACCESS_SCOPES } from "@/app/lib/semaphore-utils";
import { useSemaphoreAccess } from "@/app/lib/hooks/useSemaphoreAccess";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SensitiveFarmerData {
  id: string;
  name: string;
  documentId: string;
  walletAddress: string;
  region: string;
  cropType: string;
  riskTier: string;
  creditScore: number;
  maxCreditLimit: number;
  outstandingLoans: number;
  phoneNumber: string;
  email: string;
  createdAt: string;
}

function ProtectedFarmersContent() {
  const { generateProof } = useSemaphoreAccess();
  const [farmers, setFarmers] = useState<SensitiveFarmerData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const fetchSensitiveData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Generate ZK proof for this scope
      const proof = await generateProof(ACCESS_SCOPES.VIEW_FARMERS);
      
      if (!proof) {
        throw new Error("Failed to generate proof");
      }

      // Step 2: Verify proof and get access token
      const verifyRes = await fetch("/api/verify-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proof,
          scope: ACCESS_SCOPES.VIEW_FARMERS,
        }),
      });

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json();
        throw new Error(errorData.error || "Access denied");
      }

      const { accessToken: token } = await verifyRes.json();
      setAccessToken(token);

      // Step 3: Fetch sensitive data with access token
      const dataRes = await fetch("/api/farmers-protected", {
        headers: {
          "x-access-token": token,
        },
      });

      if (!dataRes.ok) {
        const errorData = await dataRes.json();
        throw new Error(errorData.error || "Failed to fetch data");
      }

      const { data } = await dataRes.json();
      setFarmers(data);
    } catch (err: any) {
      console.error("Failed to fetch sensitive data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rayls-black text-white p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-rayls-purple" />
            <h1 className="text-3xl font-bold">Protected Farmers Database</h1>
          </div>
          <p className="text-rayls-grey">
            This page contains sensitive farmer information and is protected by
            zero-knowledge proofs. You have successfully proven your
            authorization without revealing your identity.
          </p>
        </div>

        {/* Access Info Banner */}
        <Card className="bg-rayls-purple/10 border-rayls-purple/30 p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rayls-purple mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">
                ZK-Protected Access
              </h3>
              <p className="text-xs text-rayls-grey">
                You are viewing this data using a Semaphore zero-knowledge
                proof. Your access is logged but your specific identity remains
                anonymous. All data access is auditable on-chain.
              </p>
            </div>
          </div>
        </Card>

        {/* Load Data Button */}
        {farmers.length === 0 && !error && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-rayls-grey mx-auto mb-4" />
            <p className="text-rayls-grey mb-6">
              Click below to generate a ZK proof and load sensitive farmer data
            </p>
            <Button
              onClick={fetchSensitiveData}
              disabled={isLoading}
              className="bg-rayls-purple text-white hover:bg-rayls-purple/90"
            >
              {isLoading ? "Generating Proof..." : "Load Sensitive Data"}
            </Button>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="bg-red-500/10 border-red-500/30 p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Error Loading Data
                </h3>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Farmers List */}
        {farmers.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Farmers ({farmers.length})
              </h2>
              {accessToken && (
                <Badge
                  variant="outline"
                  className="text-xs text-rayls-lime border-rayls-lime"
                >
                  Access Token Valid
                </Badge>
              )}
            </div>

            {farmers.map((farmer) => (
              <Card
                key={farmer.id}
                className="bg-rayls-charcoal border-rayls-border p-6 hover:border-rayls-lime/30 transition-colors"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-sm text-rayls-grey mb-1">Farmer Name</h3>
                    <p className="text-white font-semibold">{farmer.name}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-rayls-grey mb-1">Document ID</h3>
                    <p className="text-white font-mono text-sm">
                      {farmer.documentId}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-rayls-grey mb-1">
                      Wallet Address
                    </h3>
                    <p className="text-white font-mono text-xs truncate">
                      {farmer.walletAddress}
                    </p>
                  </div>

                  {/* Location & Crop */}
                  <div>
                    <h3 className="text-sm text-rayls-grey mb-1">Region</h3>
                    <p className="text-white">{farmer.region}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-rayls-grey mb-1">Crop Type</h3>
                    <Badge className="bg-green-500/20 text-green-400 border-none">
                      {farmer.cropType}
                    </Badge>
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-rayls-grey mb-1">Risk Tier</h3>
                    <Badge className="bg-rayls-lime/20 text-rayls-lime border-none">
                      Tier {farmer.riskTier}
                    </Badge>
                  </div>

                  {/* Financial Info */}
                  <div>
                    <h3 className="text-sm text-rayls-grey mb-1">
                      Credit Score
                    </h3>
                    <p className="text-white font-bold">{farmer.creditScore}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-rayls-grey mb-1">
                      Max Credit Limit
                    </h3>
                    <p className="text-white font-mono">
                      ${farmer.maxCreditLimit.toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-rayls-grey mb-1">
                      Outstanding Loans
                    </h3>
                    <p className="text-white font-mono">
                      ${farmer.outstandingLoans.toLocaleString()}
                    </p>
                  </div>

                  {/* Contact Info (Most Sensitive) */}
                  <div>
                    <h3 className="text-sm text-rayls-grey mb-1">
                      Phone Number
                    </h3>
                    <p className="text-white font-mono text-sm">
                      {farmer.phoneNumber}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-rayls-grey mb-1">Email</h3>
                    <p className="text-white text-sm">{farmer.email}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-rayls-grey mb-1">
                      Registered On
                    </h3>
                    <p className="text-white text-sm">
                      {new Date(farmer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProtectedFarmersPage() {
  return (
    <ProtectedRoute scope={ACCESS_SCOPES.VIEW_FARMERS}>
      <ProtectedFarmersContent />
    </ProtectedRoute>
  );
}

