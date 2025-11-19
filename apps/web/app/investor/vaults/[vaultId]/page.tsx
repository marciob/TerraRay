"use client";

import { notFound, useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { DepositSchema, type DepositPayload } from "@/app/lib/schemas";
import { useDemo } from "@/app/lib/demo-context";

type DepositFormState = {
  values: Partial<DepositPayload>;
  errors: Record<string, string>;
};

const emptyDepositForm: DepositFormState = {
  values: {
    vaultId: "",
    amount: undefined,
  },
  errors: {},
};

function parseDepositForm(
  values: DepositFormState["values"],
): DepositPayload {
  const coerceNumber = (value: unknown) =>
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim().length > 0
        ? Number(value)
        : NaN;

  return {
    vaultId: values.vaultId ?? "",
    amount: coerceNumber(values.amount),
  };
}

export default function VaultDetailPage() {
  const params = useParams<{ vaultId: string }>();
  const { vaults, notes, positions, deposit } = useDemo();
  const [form, setForm] = useState<DepositFormState>(emptyDepositForm);
  const [connected, setConnected] = useState(false);

  const vaultId = decodeURIComponent(params.vaultId);
  const vault = vaults.find((candidate) => candidate.id === vaultId);

  if (!vault) {
    notFound();
  }

  const vaultNotes = useMemo(
    () => notes.filter((note) => note.vaultId === vault.id),
    [notes, vault.id],
  );

  const position = positions[vault.id];

  const handleChange = (
    field: keyof DepositFormState["values"],
    value: unknown,
  ) => {
    setForm((prev) => ({
      ...prev,
      values: {
        ...prev.values,
        [field]: value,
      },
      errors: {
        ...prev.errors,
        [field]: "",
      },
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const parsed = DepositSchema.safeParse(
      parseDepositForm({
        ...form.values,
        vaultId: vault.id,
      }),
    );

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      });

      setForm((prev) => ({
        ...prev,
        errors: fieldErrors,
      }));
      return;
    }

    deposit(vault.id, parsed.data.amount);
    setForm((prev) => ({
      ...prev,
      values: {
        ...prev.values,
        amount: undefined,
      },
    }));
  };

  const totalDeposited = position?.deposited ?? 0;
  const userShares = position?.shares ?? 0;

  const effectiveSharePrice =
    totalDeposited > 0 ? vault.tvl / totalDeposited : 1;
  const positionValue = userShares * effectiveSharePrice;

  const estimatedApyLabel = `${(vault.baseApr * 100).toFixed(1)}%`;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-10 lg:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
          Flow C · Investor
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {vault.name}
        </h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          {vault.description}
        </p>
      </header>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Vault profile
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-xs text-zinc-600 dark:text-zinc-400">
              <div>
                <dt className="font-medium text-zinc-700 dark:text-zinc-200">
                  Risk band
                </dt>
                <dd>{vault.riskBand}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700 dark:text-zinc-200">
                  Crop types
                </dt>
                <dd>{vault.cropTypes.join(", ")}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700 dark:text-zinc-200">
                  TVL (demo)
                </dt>
                <dd>
                  {vault.tvl.toLocaleString("en-US", {
                    style: "currency",
                    currency: "BRL",
                    maximumFractionDigits: 0,
                  })}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-700 dark:text-zinc-200">
                  Estimated APY
                </dt>
                <dd>{estimatedApyLabel}</dd>
              </div>
            </dl>

            <div className="mt-4 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
              <p className="font-medium text-zinc-700 dark:text-zinc-200">
                Strategy
              </p>
              <p>
                This vault finances a diversified pool of Brazilian farmers
                via ERC-4626 note tokens. Underwriting, limits and pricing
                are driven by your Rayls backend, with on-chain loans
                represented as fungible shares in the pool.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Current loans
            </h2>
            {vaultNotes.length === 0 ? (
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                No notes funded from this vault yet. Use the operator
                screens to underwrite a farmer and fund a first loan.
              </p>
            ) : (
              <ul className="mt-3 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                {vaultNotes.map((note) => (
                  <li
                    key={note.id}
                    className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-900"
                  >
                    <div>
                      <p className="font-mono text-[0.7rem] text-zinc-500">
                        {note.id}
                      </p>
                      <p>
                        Principal{" "}
                        {note.principal.toLocaleString("en-US", {
                          style: "currency",
                          currency: "BRL",
                          maximumFractionDigits: 0,
                        })}{" "}
                        · {(note.rate * 100).toFixed(1)}% · {note.tenorMonths}{" "}
                        m
                      </p>
                    </div>
                    <p className="text-right">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[0.7rem] ${
                          note.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-900"
                            : "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700"
                        }`}
                      >
                        {note.status}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Deposit
            </h2>

            {!connected ? (
              <button
                type="button"
                className="mt-3 inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                onClick={() => setConnected(true)}
              >
                Connect demo wallet
              </button>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Deposit amount (stablecoin, BRL equivalent)
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="mt-1 w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm outline-none ring-emerald-500 focus:bg-white focus:ring-1 dark:border-zinc-700 dark:bg-zinc-900"
                    value={form.values.amount ?? ""}
                    onChange={(event) =>
                      handleChange("amount", event.target.value)
                    }
                  />
                  {form.errors.amount ? (
                    <p className="mt-1 text-xs text-red-500">
                      {form.errors.amount}
                    </p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-700/40"
                >
                  Deposit into vault
                </button>
              </form>
            )}

            <p className="mt-3 text-[0.7rem] text-zinc-500 dark:text-zinc-400">
              This is a demo-only wallet connection and does not sign real
              transactions. In the full implementation you&apos;d plug in
              wagmi or a similar wallet library and call{" "}
              <span className="font-semibold">deposit()</span> on the
              ERC-4626 vault contract.
            </p>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Your position (demo)
            </h2>

            {!position ? (
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                Deposit into this vault to see your share balance and
                simulated position value. Repayments from the operator
                flow will push TVL higher, improving your mark-to-model.
              </p>
            ) : (
              <dl className="mt-3 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                <div>
                  <dt className="font-medium text-zinc-700 dark:text-zinc-200">
                    Total deposited
                  </dt>
                  <dd>
                    {totalDeposited.toLocaleString("en-US", {
                      style: "currency",
                      currency: "BRL",
                      maximumFractionDigits: 0,
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-700 dark:text-zinc-200">
                    Shares
                  </dt>
                  <dd>{userShares.toFixed(2)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-700 dark:text-zinc-200">
                    Implied share price
                  </dt>
                  <dd>{effectiveSharePrice.toFixed(4)}</dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-700 dark:text-zinc-200">
                    Position value (demo)
                  </dt>
                  <dd>
                    {positionValue.toLocaleString("en-US", {
                      style: "currency",
                      currency: "BRL",
                      maximumFractionDigits: 0,
                    })}
                  </dd>
                </div>
              </dl>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}



