"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function InstitutionPortalPage() {
  // Static demo data for now – not wired to real positions
  const mockAllocations = [
    {
      vault: "Cerrado IGPM – Tier A",
      exposure: 2_000_000,
      share: 0.4,
      apy: 0.132,
      status: "Open",
    },
    {
      vault: "Sul Diversified – Tier B",
      exposure: 1_250_000,
      share: 0.25,
      apy: 0.178,
      status: "Open",
    },
    {
      vault: "Coffee Premium – Tier A",
      exposure: 800_000,
      share: 0.16,
      apy: 0.149,
      status: "Open",
    },
  ];

  const totalExposure = mockAllocations.reduce(
    (sum, a) => sum + a.exposure,
    0,
  );

  return (
    <main className="min-h-screen bg-rayls-black text-white px-6 py-12 lg:px-12">
      <section className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Institution Portal
          </h1>
          <p className="text-sm text-rayls-grey max-w-2xl">
            Consolidated view of your TerraRay vault allocations, yield and
            credit exposure.
          </p>
        </header>

        {/* Top metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="border-rayls-border bg-rayls-charcoal/90 p-4 space-y-1">
            <div className="text-[11px] uppercase tracking-wide text-rayls-grey">
              Total Exposure
            </div>
            <div className="text-xl font-mono font-bold">
              {totalExposure.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              })}
            </div>
          </Card>
          <Card className="border-rayls-border bg-rayls-charcoal/90 p-4 space-y-1">
            <div className="text-[11px] uppercase tracking-wide text-rayls-grey">
              Blended Net APY
            </div>
            <div className="text-xl font-mono font-bold text-rayls-lime">
              14.3%
            </div>
          </Card>
          <Card className="border-rayls-border bg-rayls-charcoal/90 p-4 space-y-1">
            <div className="text-[11px] uppercase tracking-wide text-rayls-grey">
              Active Strategies
            </div>
            <div className="text-xl font-mono font-bold">
              {mockAllocations.length}
            </div>
          </Card>
        </div>

        {/* Allocation table */}
        <Card className="border-rayls-border bg-rayls-charcoal/90 p-6">
          <h2 className="text-sm font-semibold text-white mb-3">
            Strategy Allocations
          </h2>
          <div className="grid grid-cols-5 gap-4 text-[11px] text-rayls-grey uppercase tracking-wide border-b border-rayls-border pb-2">
            <div>Strategy</div>
            <div className="text-right">Exposure</div>
            <div className="text-right">Portfolio Share</div>
            <div className="text-right">Net APY</div>
            <div className="text-right">Status</div>
          </div>
          <div className="divide-y divide-rayls-border text-xs">
            {mockAllocations.map((a) => (
              <div
                key={a.vault}
                className="grid grid-cols-5 gap-4 py-3 items-center"
              >
                <div>{a.vault}</div>
                <div className="text-right font-mono">
                  {a.exposure.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })}
                </div>
                <div className="text-right font-mono">
                  {(a.share * 100).toFixed(1)}%
                </div>
                <div className="text-right font-mono text-rayls-lime">
                  {(a.apy * 100).toFixed(2)}%
                </div>
                <div className="text-right">
                  <Badge className="bg-rayls-lime/15 text-rayls-lime border-rayls-lime/40 text-[10px]">
                    {a.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </main>
  );
}


