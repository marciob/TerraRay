"use client";

import Link from "next/link";
import { ArrowUpRight, TrendingUp, Users, Wallet, Sprout } from "lucide-react";
import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { BrazilMap } from "@/components/dashboard/BrazilMap";
import { Button } from "@/components/ui/button";
import { CONTRACT_ADDRESSES, AGRO_VAULT_ABI, FARMER_REGISTRY_ABI } from "@/app/lib/contracts";

export default function LandingPage() {
  // Read live data from blockchain
  const { data: totalAssets } = useReadContract({
    address: CONTRACT_ADDRESSES.AgroVault,
    abi: AGRO_VAULT_ABI,
    functionName: "totalAssets",
  });

  const { data: totalOutstanding } = useReadContract({
    address: CONTRACT_ADDRESSES.AgroVault,
    abi: AGRO_VAULT_ABI,
    functionName: "totalOutstandingPrincipal",
  });

  const { data: approvedFarmerCount } = useReadContract({
    address: CONTRACT_ADDRESSES.FarmerRegistry,
    abi: FARMER_REGISTRY_ABI,
    functionName: "approvedFarmerCount",
  });

  const { data: noteCount } = useReadContract({
    address: CONTRACT_ADDRESSES.AgroVault,
    abi: AGRO_VAULT_ABI,
    functionName: "getNoteCount",
  });

  // Calculate metrics
  const tvl = totalAssets ? Number(formatUnits(totalAssets as bigint, 6)) : 0;
  const deployed = totalOutstanding ? Number(formatUnits(totalOutstanding as bigint, 6)) : 0;
  const utilization = tvl > 0 ? (deployed / tvl) * 100 : 0;
  const liquidCash = tvl - deployed;

  return (
    <main className="flex flex-1 flex-col bg-rayls-black text-white overflow-hidden relative">
      {/* Hero Section with Metrics */}
      <div className="z-10 w-full border-b border-rayls-border bg-rayls-charcoal/50 p-6 backdrop-blur-md">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">Protocol Overview</h1>
            <p className="text-sm text-rayls-grey">Real-time institutional credit analytics</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* TVL */}
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wider text-rayls-grey font-medium flex items-center gap-2">
                <Wallet className="h-3 w-3" /> Total Value Locked
              </div>
              <div className="text-2xl font-mono font-bold text-white drop-shadow-[0_0_10px_rgba(157,140,252,0.3)]">
                {totalAssets ? `$${(tvl / 1_000_000).toFixed(2)}M` : "Loading..."}
              </div>
              <div className="text-[10px] text-rayls-lime flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" /> Live on Rayls
              </div>
            </div>

            {/* APY */}
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wider text-rayls-grey font-medium flex items-center gap-2">
                <TrendingUp className="h-3 w-3" /> Weighted Avg. APY
              </div>
              <div className="text-2xl font-mono font-bold text-rayls-lime">14.2%</div>
              <div className="text-[10px] text-rayls-grey">Risk-adjusted return</div>
            </div>

            {/* Active Farmers */}
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wider text-rayls-grey font-medium flex items-center gap-2">
                <Users className="h-3 w-3" /> Active Farmers
              </div>
              <div className="text-2xl font-mono font-bold text-white">
                {approvedFarmerCount !== undefined ? approvedFarmerCount.toString() : "..."}
              </div>
              <div className="text-[10px] text-rayls-grey">
                {noteCount !== undefined ? `${noteCount} active loans` : "Across multiple regions"}
              </div>
            </div>

            {/* Capital Deployed */}
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wider text-rayls-grey font-medium flex items-center gap-2">
                <Sprout className="h-3 w-3" /> Capital Deployed
              </div>
              <div className="text-2xl font-mono font-bold text-white">
                {totalOutstanding ? `$${(deployed / 1_000_000).toFixed(2)}M` : "Loading..."}
              </div>
              <div className="text-[10px] text-rayls-grey">
                {totalAssets ? `${utilization.toFixed(1)}% Utilization` : "Calculating..."}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Map Content */}
      <div className="relative flex-1 flex items-center justify-center min-h-[600px]">
        <div className="absolute inset-0 z-0">
          <BrazilMap />
        </div>

        {/* Entry point CTAs – compact and separated from metrics */}
        <div className="z-10 absolute top-10 left-1/2 -translate-x-1/2">
          <div className="flex flex-col md:flex-row items-center gap-4 rounded-xl border border-rayls-border/80 bg-rayls-charcoal/90 px-5 py-4 backdrop-blur-sm">
            <div className="text-sm text-rayls-grey mr-2">
              <div className="font-semibold text-white text-base">Access TerraRay</div>
              <div className="text-xs">
                Choose your entry point: institutional capital or producer onboarding.
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/investor/vaults">
                <Button className="bg-rayls-lime text-black hover:bg-rayls-lime/80 h-9 px-4 text-sm font-semibold">
                  Institutions
                </Button>
              </Link>
              <Link href="/operator/farmers/new">
                <Button
                  variant="outline"
                  className="h-9 px-4 text-sm border-rayls-border text-rayls-grey hover:text-white hover:border-rayls-lime/60"
                >
                  Producers
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
