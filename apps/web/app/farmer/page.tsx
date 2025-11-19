"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function FarmerPortalPage() {
  // For now this is static demo data, not wired to the registry
  const mockPassport = {
    status: "Minted",
    tier: "A",
    band: "A–BBB",
    score: 86,
    maxCreditLimit: 750_000,
  };

  const mockLoans = [
    {
      id: "NOTE-001",
      vault: "Cerrado IGPM – Tier A",
      principal: 250_000,
      outstanding: 180_000,
      rate: 0.132,
      tenorMonths: 12,
      status: "Performing",
      nextDue: "2025-03-10",
    },
    {
      id: "NOTE-002",
      vault: "Sul Diversified – Tier B",
      principal: 150_000,
      outstanding: 120_000,
      rate: 0.182,
      tenorMonths: 9,
      status: "Performing",
      nextDue: "2025-02-25",
    },
  ];

  return (
    <main className="min-h-screen bg-rayls-black text-white px-6 py-12 lg:px-12">
      <section className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Farmer Portal</h1>
          <p className="text-sm text-rayls-grey max-w-2xl">
            View your credit passport, active loans, and upcoming repayments in one place.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          {/* Credit Passport */}
          <Card className="border-rayls-border bg-rayls-charcoal/90 p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white mb-1">
                  Credit Passport
                </h2>
                <p className="text-xs text-rayls-grey">
                  Zero-knowledge linked credit profile minted on Rayls.
                </p>
              </div>
              <Badge
                variant="secondary"
                className="bg-rayls-purple/20 text-rayls-purple border-rayls-purple/50 text-[10px]"
              >
                {mockPassport.status}
              </Badge>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative h-20 w-20 flex items-center justify-center rounded-full border-4 border-rayls-lime/30">
                <div className="absolute inset-1 rounded-full border-4 border-rayls-lime border-l-transparent rotate-45" />
                <div className="text-center">
                  <div className="text-xl font-bold">{mockPassport.score}</div>
                  <div className="text-[10px] text-rayls-grey">/ 100</div>
                </div>
              </div>
              <div className="space-y-1 text-xs">
                <div>
                  <span className="text-rayls-grey uppercase tracking-wide">
                    Tier
                  </span>
                  <div className="text-sm font-semibold text-white">
                    {mockPassport.tier} <span className="text-rayls-grey">({mockPassport.band})</span>
                  </div>
                </div>
                <div>
                  <span className="text-rayls-grey uppercase tracking-wide">
                    Max Credit Limit
                  </span>
                  <div className="text-sm font-mono">
                    {mockPassport.maxCreditLimit.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    })}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Upcoming Repayments */}
          <Card className="border-rayls-border bg-rayls-charcoal/90 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white mb-1">
                  Upcoming Repayments
                </h2>
                <p className="text-xs text-rayls-grey">
                  Next obligations across your active notes.
                </p>
              </div>
            </div>
            <div className="divide-y divide-rayls-border/80 text-xs">
              {mockLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="flex items-center justify-between py-3 gap-4"
                >
                  <div>
                    <div className="font-mono text-[11px] text-rayls-grey">
                      {loan.id}
                    </div>
                    <div className="text-sm text-white">{loan.vault}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-rayls-grey">
                      Next due
                    </div>
                    <div className="text-sm">
                      {new Date(loan.nextDue).toLocaleDateString("en-US")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Active Loans Table */}
        <Card className="border-rayls-border bg-rayls-charcoal/90 p-6">
          <h2 className="text-sm font-semibold text-white mb-3">
            Active Loans
          </h2>
          <div className="grid grid-cols-6 gap-4 text-[11px] text-rayls-grey uppercase tracking-wide border-b border-rayls-border pb-2">
            <div>Note</div>
            <div>Vault</div>
            <div className="text-right">Principal</div>
            <div className="text-right">Outstanding</div>
            <div className="text-right">Rate</div>
            <div className="text-right">Status</div>
          </div>
          <div className="divide-y divide-rayls-border text-xs">
            {mockLoans.map((loan) => (
              <div
                key={loan.id}
                className="grid grid-cols-6 gap-4 py-3 items-center"
              >
                <div className="font-mono text-[11px] text-rayls-grey">
                  {loan.id}
                </div>
                <div>{loan.vault}</div>
                <div className="text-right font-mono">
                  {loan.principal.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })}
                </div>
                <div className="text-right font-mono text-rayls-grey">
                  {loan.outstanding.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })}
                </div>
                <div className="text-right">
                  {(loan.rate * 100).toFixed(1)}%
                </div>
                <div className="text-right">
                  <Badge className="bg-rayls-lime/15 text-rayls-lime border-rayls-lime/50 text-[10px]">
                    {loan.status}
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


