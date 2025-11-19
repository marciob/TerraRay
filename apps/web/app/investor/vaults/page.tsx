"use client";

import Link from "next/link";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { useDemo } from "@/app/lib/demo-context";
import { Badge } from "@/components/ui/badge";

export default function VaultsPage() {
  const { vaults, notes } = useDemo();

  return (
    <main className="min-h-screen bg-rayls-black text-white px-6 py-12 lg:px-12">
      <header className="max-w-7xl mx-auto mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          Institutional Access Strategies
        </h1>
        <p className="text-sm text-rayls-grey">
          Capital deployment opportunities across risk-tranched agricultural credit pools.
        </p>
      </header>

      <section className="max-w-7xl mx-auto">
        <div className="w-full overflow-x-auto rounded-xl border border-rayls-border bg-rayls-charcoal">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-rayls-grey uppercase bg-rayls-dark border-b border-rayls-border">
              <tr>
                <th className="px-6 py-4 font-medium tracking-wider">Strategy Name</th>
                <th className="px-6 py-4 font-medium tracking-wider">Risk Tier</th>
                <th className="px-6 py-4 font-medium tracking-wider">Target Net APY</th>
                <th className="px-6 py-4 font-medium tracking-wider">Liquidity</th>
                <th className="px-6 py-4 font-medium tracking-wider">Duration</th>
                <th className="px-6 py-4 font-medium tracking-wider w-48">Utilization</th>
                <th className="px-6 py-4 font-medium tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rayls-border">
              {vaults.map((vault) => {
                // Calculate mocked utilization
                const vaultNotes = notes.filter((note) => note.vaultId === vault.id);
                const activeCount = vaultNotes.filter((note) => note.status === "Active").length;
                const utilization = Math.min(Math.max((activeCount / 10) * 100, 15), 95); // Mock utilization %

                return (
                  <tr 
                    key={vault.id} 
                    className="group bg-rayls-black hover:bg-rayls-hover transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                       <Link href={`/investor/vaults/${encodeURIComponent(vault.id)}`} className="block">
                          <div className="font-semibold text-white group-hover:text-rayls-lime transition-colors">
                            {vault.name}
                          </div>
                          <div className="text-xs text-rayls-grey truncate max-w-[200px]">{vault.description}</div>
                       </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="rayls" className="border-rayls-purple text-rayls-purple">
                        {vault.riskBand === "A" || vault.riskBand === "AA" ? "Senior" : vault.riskBand === "B" ? "Mezzanine" : "Junior"} {vault.riskBand}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-rayls-lime text-base">
                      {(vault.baseApr * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 font-mono text-white">
                      {vault.tvl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </td>
                    <td className="px-6 py-4 text-rayls-grey">
                      12 Months
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] text-rayls-grey">
                           <span>{utilization.toFixed(0)}% Deployed</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-rayls-border">
                          <div 
                            className="h-1.5 rounded-full bg-rayls-lime transition-all duration-500" 
                            style={{ width: `${utilization}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <Link href={`/investor/vaults/${encodeURIComponent(vault.id)}`}>
                          <div className="p-2 rounded-full hover:bg-rayls-dark inline-flex">
                             <ArrowRight className="h-4 w-4 text-rayls-grey group-hover:text-white" />
                          </div>
                       </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
