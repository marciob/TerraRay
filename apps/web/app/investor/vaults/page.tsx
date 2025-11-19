//app/investor/vaults/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useDemo } from "@/app/lib/demo-context";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

function getVaultImage(id: string) {
  if (id === "cerrado-igpm-a") return "/graos.jpg";
  if (id === "coffee-premium-a") return "/coffee.jpg";
  if (id === "sul- diversified-b") return "/mix.jpg";
  return "/mix.jpg";
}

export default function VaultsPage() {
  const { vaults, notes } = useDemo();

  return (
    <main className="min-h-screen bg-rayls-black text-white px-6 py-12 lg:px-12">
      <header className="max-w-7xl mx-auto mb-8 flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Institutional Access Strategies
        </h1>
        <p className="text-sm text-rayls-grey max-w-2xl">
          Capital deployment opportunities across risk-tranched agricultural credit pools on the Rayls public chain.
        </p>
      </header>

      <section className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {vaults.map((vault) => {
            const vaultNotes = notes.filter((note) => note.vaultId === vault.id);
            const activeCount = vaultNotes.filter((note) => note.status === "Active").length;
            const utilization = Math.min(Math.max((activeCount / 10) * 100, 15), 95);

            const tierLabel =
              vault.riskBand === "A" || vault.riskBand === "AA"
                ? "Senior"
                : vault.riskBand === "B"
                ? "Mezzanine"
                : "Junior";

          return (
            <Link
              key={vault.id}
              href={`/investor/vaults/${encodeURIComponent(vault.id)}`}
                className="group"
              >
                <Card className="h-full border-rayls-border bg-rayls-charcoal/90 hover:border-rayls-lime/40 transition-colors flex flex-col justify-between overflow-hidden">
                  {/* Vault image */}
                  <div className="relative h-32 w-full overflow-hidden">
                    <Image
                      src={getVaultImage(vault.id)}
                      alt={vault.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                      priority={false}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-2 left-3 flex items-center gap-2 text-[11px] text-rayls-grey">
                      <span className="inline-flex items-center rounded-full bg-black/50 px-2 py-0.5">
                        {vault.cropTypes.join(" • ")}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-semibold text-white mb-1 group-hover:text-rayls-lime transition-colors">
                  {vault.name}
                </h2>
                        <p className="text-xs text-rayls-grey line-clamp-2">
                  {vault.description}
                </p>
                      </div>
                      <Badge
                        variant="rayls"
                        className="border-rayls-purple text-rayls-purple text-[10px] px-2 py-0.5"
                      >
                        {tierLabel} · {vault.riskBand}
                      </Badge>
              </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase tracking-wide text-rayls-grey">
                          Target Net APY
                        </div>
                        <div className="text-sm font-mono font-bold text-rayls-lime">
                          {(vault.baseApr * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase tracking-wide text-rayls-grey">
                          Liquidity
                        </div>
                        <div className="text-sm font-mono text-white">
                  {vault.tvl.toLocaleString("en-US", {
                    style: "currency",
                            currency: "USD",
                          })}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase tracking-wide text-rayls-grey">
                          Duration
                        </div>
                        <div className="text-sm text-rayls-grey">12 Months</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase tracking-wide text-rayls-grey">
                          Crop Exposure
                        </div>
                        <div className="text-[11px] text-rayls-grey truncate">
                          {vault.cropTypes.join(", ")}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-rayls-grey">
                        <span>{utilization.toFixed(0)}% Deployed</span>
                        <span>{activeCount} active notes</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-rayls-border">
                        <div
                          className="h-1.5 rounded-full bg-rayls-lime transition-all duration-500"
                          style={{ width: `${utilization}%` }}
                        />
                      </div>
                    </div>
              </div>

                  <div className="flex items-center justify-between px-5 py-3 border-t border-rayls-border/60 text-[11px] text-rayls-grey">
                    <span>View vault details</span>
                    <span className="inline-flex items-center gap-1 text-rayls-grey group-hover:text-white">
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Card>
            </Link>
          );
        })}
        </div>
      </section>
    </main>
  );
}
