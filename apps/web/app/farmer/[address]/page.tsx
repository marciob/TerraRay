//app/farmer/[address]/page.tsx
"use client";

import { notFound, useParams } from "next/navigation";
import { useReadContract } from "wagmi";
import { ArrowLeft, MapPin, Sprout, TrendingUp, DollarSign, Award, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CONTRACT_ADDRESSES, FARMER_REGISTRY_ABI, AGRO_VAULT_ABI, CREDIT_PASSPORT_ABI } from "@/app/lib/contracts";
import { formatUnits } from "viem";

// Map on-chain enum values to display names
const CROP_TYPES = ["Unknown", "Soy", "Corn", "Coffee", "Fruits", "Specialty", "Other"];
const REGIONS = ["Unknown", "North", "Northeast", "Central", "Southeast", "South"];
const RISK_TIER_LABELS = ["", "Tier 1 (Prime)", "Tier 2 (Low Risk)", "Tier 3 (Medium)", "Tier 4 (Higher Risk)", "Tier 5 (Frontier)"];

export default function FarmerProfilePage() {
  const params = useParams<{ address: string }>();
  const farmerAddress = params.address as `0x${string}`;

  // Read farmer data from FarmerRegistry
  const { data: farmerData } = useReadContract({
    address: CONTRACT_ADDRESSES.FarmerRegistry,
    abi: FARMER_REGISTRY_ABI,
    functionName: "getFarmer",
    args: [farmerAddress],
  });

  // Read farmer's notes from AgroVault
  const { data: farmerNoteIds } = useReadContract({
    address: CONTRACT_ADDRESSES.AgroVault,
    abi: AGRO_VAULT_ABI,
    functionName: "getFarmerNoteIds",
    args: [farmerAddress],
  });

  // Read total funded to farmer
  const { data: totalFunded } = useReadContract({
    address: CONTRACT_ADDRESSES.AgroVault,
    abi: AGRO_VAULT_ABI,
    functionName: "getTotalFundedToFarmer",
    args: [farmerAddress],
  });

  // Read Credit Passport token ID
  const { data: passportTokenId } = useReadContract({
    address: CONTRACT_ADDRESSES.CreditPassport,
    abi: CREDIT_PASSPORT_ABI,
    functionName: "getTokenIdByFarmer",
    args: [farmerAddress],
  });

  if (!farmerData || !(farmerData as any).approved) {
    notFound();
  }

  const farmer = farmerData as { approved: boolean; riskTier: number; cropType: number; region: number; metadataURI: string };
  const noteCount = farmerNoteIds ? (farmerNoteIds as bigint[]).length : 0;
  const totalFundedAmount = totalFunded ? Number(formatUnits(totalFunded as bigint, 6)) : 0;
  const hasPassport = passportTokenId && (passportTokenId as bigint) > 0n;

  // Decode metadata if it's a data URI
  let metadata: any = null;
  if (farmer.metadataURI) {
    try {
      if (farmer.metadataURI.startsWith("data:application/json;base64,")) {
        const base64 = farmer.metadataURI.replace("data:application/json;base64,", "");
        const decoded = Buffer.from(base64, "base64").toString("utf-8");
        metadata = JSON.parse(decoded);
      }
    } catch (e) {
      console.error("Failed to decode metadata:", e);
    }
  }

  return (
    <main className="min-h-screen bg-rayls-black text-white px-6 py-12 lg:px-12 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Link href="/investor/vaults/cerrado-igpm-a">
          <Button variant="ghost" className="mb-6 text-rayls-grey hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vault
          </Button>
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">Farmer Profile</h1>
              {hasPassport && (
                <Badge className="bg-rayls-purple/20 text-rayls-purple border-rayls-purple/50">
                  <Award className="mr-1 h-3 w-3" />
                  Credit Passport Verified
                </Badge>
              )}
            </div>
            <p className="text-sm text-rayls-grey font-mono">{farmerAddress}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-rayls-charcoal border-rayls-border p-4">
            <div className="text-xs text-rayls-grey uppercase mb-1">Risk Tier</div>
            <div className="text-2xl font-bold text-rayls-lime">
              {RISK_TIER_LABELS[farmer.riskTier] || "Unknown"}
            </div>
          </Card>

          <Card className="bg-rayls-charcoal border-rayls-border p-4">
            <div className="text-xs text-rayls-grey uppercase mb-1 flex items-center gap-1">
              <Sprout className="h-3 w-3" />
              Crop Type
            </div>
            <div className="text-2xl font-bold text-white">
              {CROP_TYPES[farmer.cropType] || "Unknown"}
            </div>
          </Card>

          <Card className="bg-rayls-charcoal border-rayls-border p-4">
            <div className="text-xs text-rayls-grey uppercase mb-1 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Region
            </div>
            <div className="text-2xl font-bold text-white">
              {REGIONS[farmer.region] || "Unknown"}
            </div>
          </Card>

          <Card className="bg-rayls-charcoal border-rayls-border p-4">
            <div className="text-xs text-rayls-grey uppercase mb-1 flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Total Funded
            </div>
            <div className="text-2xl font-bold text-white font-mono">
              ${totalFundedAmount.toLocaleString()}
            </div>
          </Card>
        </div>

        {/* Loan History */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Loan History</h3>
          <Card className="bg-rayls-charcoal border-rayls-border overflow-hidden">
            <div className="grid grid-cols-4 gap-4 p-4 text-xs font-semibold text-rayls-grey uppercase tracking-wider border-b border-rayls-border">
              <div>Note ID</div>
              <div>Principal</div>
              <div>Interest Rate</div>
              <div className="text-right">Status</div>
            </div>
            <div className="divide-y divide-rayls-border">
              {noteCount > 0 && farmerNoteIds ? (
                (farmerNoteIds as bigint[]).map((noteId) => (
                  <NoteRow key={noteId.toString()} noteId={noteId} />
                ))
              ) : (
                <div className="p-8 text-center text-rayls-grey">
                  No loans yet for this farmer.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Metadata Display */}
        {metadata && (
          <Card className="bg-rayls-charcoal border-rayls-border p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-rayls-purple" />
              Verified Metadata
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-rayls-grey">Farm Name:</span>
                <span className="text-white font-semibold">{metadata.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rayls-grey">Credit Score:</span>
                <span className="text-rayls-lime font-mono text-lg">{metadata.creditScore}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rayls-grey">Max Credit Limit:</span>
                <span className="text-white font-mono">${metadata.maxCreditLimit?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rayls-grey">Description:</span>
                <span className="text-white text-right max-w-md">{metadata.description}</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}

// Sub-component to read individual note data
function NoteRow({ noteId }: { noteId: bigint }) {
  const { data: noteData } = useReadContract({
    address: CONTRACT_ADDRESSES.FarmerNote,
    abi: [
      {
        inputs: [{ name: "noteId", type: "uint256" }],
        name: "getNote",
        outputs: [
          {
            components: [
              { name: "farmer", type: "address" },
              { name: "principal", type: "uint256" },
              { name: "interestRateBps", type: "uint256" },
              { name: "maturityTimestamp", type: "uint256" },
              { name: "status", type: "uint8" },
              { name: "vault", type: "address" },
            ],
            type: "tuple",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ],
    functionName: "getNote",
    args: [noteId],
  });

  const { data: outstanding } = useReadContract({
    address: CONTRACT_ADDRESSES.AgroVault,
    abi: AGRO_VAULT_ABI,
    functionName: "noteOutstandingPrincipal",
    args: [noteId],
  });

  if (!noteData) return null;

  const note = noteData as { principal: bigint; interestRateBps: bigint; maturityTimestamp: bigint; status: number };
  const principal = Number(formatUnits(note.principal, 6));
  const rate = Number(note.interestRateBps) / 100;
  const outstandingAmount = outstanding ? Number(formatUnits(outstanding as bigint, 6)) : 0;
  const isRepaid = outstandingAmount === 0;

  return (
    <div className="grid grid-cols-4 gap-4 p-4 text-sm items-center hover:bg-white/5 transition-colors">
      <div className="font-mono text-rayls-lime">#{noteId.toString()}</div>
      <div className="font-mono">${principal.toLocaleString()}</div>
      <div className="font-mono text-white">{rate}% APR</div>
      <div className="text-right">
        <Badge
          variant="outline"
          className={
            isRepaid
              ? "border-green-500 text-green-500 bg-green-500/10"
              : "border-rayls-lime text-rayls-lime bg-rayls-lime/10"
          }
        >
          {isRepaid ? "Repaid" : "Active"}
        </Badge>
      </div>
    </div>
  );
}

