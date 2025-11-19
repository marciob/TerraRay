//app/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { BrazilMap } from "@/components/dashboard/BrazilMap";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LandingPage() {
  const [view, setView] = useState<"origination" | "capital">("origination");

  return (
    <main className="flex flex-1 flex-col bg-rayls-black text-white overflow-hidden relative">
      {/* Top Stats Bar - Added margin-top to avoid overlap with fixed header */}
      <div className="z-10 flex flex-col md:flex-row items-center justify-end border-b border-rayls-border bg-rayls-charcoal/50 p-4 backdrop-blur-md">
        <div className="flex gap-8">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-rayls-grey">
              Total Value Locked
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-mono font-bold text-white drop-shadow-[0_0_10px_rgba(157,140,252,0.5)]">
                R$ 12.450.000
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-rayls-grey">
              Active Farmers
            </span>
            <span className="text-xl font-mono font-bold text-white">42</span>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-rayls-grey">
              Avg. Portfolio Yield
            </span>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-rayls-lime" />
              <span className="text-xl font-mono font-bold text-rayls-lime">
                14.2% APY
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative flex-1 flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <BrazilMap />
        </div>

        {/* Interaction Layer */}
        <div className="z-10 flex flex-col items-center gap-8">
          {/* Toggle */}
          <div className="flex rounded-full border border-rayls-border bg-rayls-charcoal p-1">
            <button
              onClick={() => setView("origination")}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
                view === "origination"
                  ? "bg-rayls-lime text-black shadow-[0_0_15px_rgba(217,249,79,0.3)]"
                  : "text-rayls-grey hover:text-white"
              }`}
            >
              Origination Desk
            </button>
            <button
              onClick={() => setView("capital")}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
                view === "capital"
                  ? "bg-rayls-lime text-black shadow-[0_0_15px_rgba(217,249,79,0.3)]"
                  : "text-rayls-grey hover:text-white"
              }`}
            >
              Capital Markets
            </button>
          </div>

          {/* Action Card */}
          <Card className="w-[350px] border-rayls-border bg-rayls-charcoal/90 backdrop-blur-sm p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="mb-2 text-xl font-semibold text-white">
              {view === "origination"
                ? "Credit Origination"
                : "Institutional Vaults"}
            </h2>
            <p className="mb-6 text-sm text-rayls-grey">
              {view === "origination"
                ? "Access AI-powered underwriting and risk assessment for agricultural assets."
                : "Deploy capital into diversified, risk-tranched agricultural credit strategies."}
            </p>

            <Link
              href={
                view === "origination"
                  ? "/operator/farmers/new"
                  : "/investor/vaults"
              }
            >
              <Button className="w-full bg-rayls-lime text-black hover:bg-rayls-lime/80 group">
                {view === "origination" ? "Access Desk" : "View Opportunities"}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </main>
  );
}
