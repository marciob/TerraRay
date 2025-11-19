"use client";

import Link from "next/link";
import { useDemo } from "@/app/lib/demo-context";

export default function VaultsPage() {
  const { vaults, notes } = useDemo();

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-10 lg:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
          Flow C · Investor
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Vault Explorer
        </h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Browse the three multi-farmer vaults, understand their risk bands
          and crop exposure, and click into one to simulate a deposit and
          see how Rayls structures your position.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {vaults.map((vault) => {
          const vaultNotes = notes.filter(
            (note) => note.vaultId === vault.id,
          );
          const activeCount = vaultNotes.filter(
            (note) => note.status === "Active",
          ).length;

          return (
            <Link
              key={vault.id}
              href={`/investor/vaults/${encodeURIComponent(vault.id)}`}
              className="group flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-emerald-500/70 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {vault.name}
                </h2>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {vault.description}
                </p>
              </div>

              <div className="mt-4 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                <p>
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">
                    Risk band:
                  </span>{" "}
                  {vault.riskBand}
                </p>
                <p>
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">
                    Crop types:
                  </span>{" "}
                  {vault.cropTypes.join(", ")}
                </p>
                <p>
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">
                    TVL:
                  </span>{" "}
                  {vault.tvl.toLocaleString("en-US", {
                    style: "currency",
                    currency: "BRL",
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p>
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">
                    Rough APR:
                  </span>{" "}
                  {(vault.baseApr * 100).toFixed(1)}%
                </p>
                <p>
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">
                    Active notes:
                  </span>{" "}
                  {activeCount}
                </p>
              </div>

              <p className="mt-4 text-xs font-medium text-emerald-700 group-hover:underline dark:text-emerald-400">
                View vault details &amp; deposit →
              </p>
            </Link>
          );
        })}
      </section>
    </main>
  );
}



