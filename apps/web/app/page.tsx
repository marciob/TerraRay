"use client";

import Link from "next/link";
import { ArrowUpRight, TrendingUp, Users, Wallet, Sprout } from "lucide-react";
import { BrazilMap } from "@/components/dashboard/BrazilMap";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col bg-rayls-black text-white overflow-hidden relative">
      {/* Hero Section with Metrics */}
      <div className="z-10 w-full border-b border-rayls-border bg-rayls-charcoal/50 p-6 backdrop-blur-md">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-1">Protocol Overview</h1>
            <p className="text-sm text-rayls-grey">Real-time institutional credit analytics</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {/* Banks / Institutions CTA */}
              <Link href="/investor/vaults">
                <Button className="bg-rayls-lime text-black hover:bg-rayls-lime/80 font-semibold">
                  For Institutions – View Capital Markets
                </Button>
              </Link>

              {/* Farmers / Operators CTA (lower emphasis) */}
              <Link href="/operator/farmers/new">
                <Button
                  variant="outline"
                  className="border-rayls-border text-rayls-grey hover:text-white hover:border-rayls-lime/60"
                >
                  For Producers – Connect with Origination Desk
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* TVL */}
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wider text-rayls-grey font-medium flex items-center gap-2">
                <Wallet className="h-3 w-3" /> Total Value Locked
              </div>
              <div className="text-2xl font-mono font-bold text-white drop-shadow-[0_0_10px_rgba(157,140,252,0.3)]">
                R$ 12.450.000
              </div>
              <div className="text-[10px] text-rayls-lime flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" /> +2.4% (24h)
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
              <div className="text-2xl font-mono font-bold text-white">42</div>
              <div className="text-[10px] text-rayls-grey">Across 3 regions</div>
            </div>

            {/* Capital Deployed */}
            <div className="space-y-1">
              <div className="text-xs uppercase tracking-wider text-rayls-grey font-medium flex items-center gap-2">
                <Sprout className="h-3 w-3" /> Capital Deployed
              </div>
              <div className="text-2xl font-mono font-bold text-white">R$ 8.100.000</div>
              <div className="text-[10px] text-rayls-grey">65% Utilization</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Map Content */}
      <div className="relative flex-1 flex items-center justify-center min-h-[600px]">
        <div className="absolute inset-0 z-0">
          <BrazilMap />
        </div>
      </div>
    </main>
  );
}
