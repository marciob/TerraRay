"use client";

import { useMemo, useState } from "react";
import {
  LoanCreationSchema,
  type LoanCreationPayload,
  type LoanNote,
} from "@/app/lib/schemas";
import { useDemo } from "@/app/lib/demo-context";

type LoanFormState = {
  values: Partial<LoanCreationPayload>;
  errors: Record<string, string>;
};

const emptyLoanForm: LoanFormState = {
  values: {
    farmerId: "",
    vaultId: "",
    principal: undefined,
    tenorMonths: 12,
  },
  errors: {},
};

function parseLoanForm(values: LoanFormState["values"]): LoanCreationPayload {
  const coerceNumber = (value: unknown) =>
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim().length > 0
        ? Number(value)
        : NaN;

  return {
    farmerId: values.farmerId ?? "",
    vaultId: values.vaultId ?? "",
    principal: coerceNumber(values.principal),
    tenorMonths:
      typeof values.tenorMonths === "number"
        ? values.tenorMonths
        : Number(values.tenorMonths ?? 12),
  };
}

export default function NewLoanPage() {
  const { farmers, vaults, addNote } = useDemo();
  const [form, setForm] = useState<LoanFormState>(emptyLoanForm);
  const [createdNote, setCreatedNote] = useState<LoanNote | null>(null);

  const selectedFarmer = useMemo(
    () => farmers.find((farmer) => farmer.id === form.values.farmerId),
    [farmers, form.values.farmerId],
  );

  const selectedVault = useMemo(
    () => vaults.find((vault) => vault.id === form.values.vaultId),
    [vaults, form.values.vaultId],
  );

  const handleChange = (
    field: keyof LoanFormState["values"],
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
    setCreatedNote(null);

    const parsed = LoanCreationSchema.safeParse(
      parseLoanForm(form.values),
    );

    const errors: Record<string, string> = {};

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (!errors[path]) {
          errors[path] = issue.message;
        }
      });
    }

    if (selectedFarmer && parsed.success) {
      if (parsed.data.principal > selectedFarmer.maxCreditLimit) {
        errors.principal = `Principal exceeds farmer max credit limit of USD ${selectedFarmer.maxCreditLimit.toLocaleString(
          "en-US",
        )}`;
      }
    }

    if (Object.keys(errors).length > 0 || !parsed.success) {
      setForm((prev) => ({
        ...prev,
        errors,
      }));
      return;
    }

    if (!selectedVault || !selectedFarmer) {
      setForm((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          root:
            "Select a valid farmer and vault before funding the loan.",
        },
      }));
      return;
    }

    const riskRateBump: Record<string, number> = {
      A: 0,
      B: 0.02,
      C: 0.04,
      D: 0.06,
    };
    const rate =
      (selectedVault.baseApr ?? 0.14) +
      (riskRateBump[selectedFarmer.riskTier] ?? 0);

    const note: LoanNote = {
      id: `note-${Date.now()}`,
      farmerId: selectedFarmer.id,
      vaultId: selectedVault.id,
      principal: parsed.data.principal,
      tenorMonths: parsed.data.tenorMonths,
      rate,
      outstanding: parsed.data.principal,
      status: "Active",
    };

    addNote(note);
    setCreatedNote(note);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-10 lg:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
          Flow B · Operator
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Create &amp; Fund Loan
        </h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Pick an approved farmer, choose one of the predefined ERC-4626
          vaults, set principal and tenor, and fund a new loan note. This
          writes into the shared demo state so investors immediately see the
          new exposure.
        </p>
      </header>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Farmer
              </label>
              <select
                className="mt-1 w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm outline-none ring-emerald-500 focus:bg-white focus:ring-1 dark:border-zinc-700 dark:bg-zinc-900"
                value={form.values.farmerId ?? ""}
                onChange={(event) =>
                  handleChange("farmerId", event.target.value)
                }
              >
                <option value="">Select approved farmer</option>
                {farmers.map((farmer) => (
                  <option key={farmer.id} value={farmer.id}>
                    {farmer.name} · Tier {farmer.riskTier} · Max{" "}
                    {farmer.maxCreditLimit.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    })}
                  </option>
                ))}
              </select>
              {form.errors.farmerId ? (
                <p className="mt-1 text-xs text-red-500">
                  {form.errors.farmerId}
                </p>
              ) : null}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Vault
              </label>
              <select
                className="mt-1 w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm outline-none ring-emerald-500 focus:bg-white focus:ring-1 dark:border-zinc-700 dark:bg-zinc-900"
                value={form.values.vaultId ?? ""}
                onChange={(event) =>
                  handleChange("vaultId", event.target.value)
                }
              >
                <option value="">Select vault</option>
                {vaults.map((vault) => (
                  <option key={vault.id} value={vault.id}>
                    {vault.name} · {vault.riskBand}
                  </option>
                ))}
              </select>
              {form.errors.vaultId ? (
                <p className="mt-1 text-xs text-red-500">
                  {form.errors.vaultId}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Principal (USD)
                </label>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm outline-none ring-emerald-500 focus:bg-white focus:ring-1 dark:border-zinc-700 dark:bg-zinc-900"
                  value={form.values.principal ?? ""}
                  onChange={(event) =>
                    handleChange("principal", event.target.value)
                  }
                />
                {form.errors.principal ? (
                  <p className="mt-1 text-xs text-red-500">
                    {form.errors.principal}
                  </p>
                ) : null}
                {selectedFarmer ? (
                  <p className="mt-1 text-[0.7rem] text-zinc-500 dark:text-zinc-400">
                    Max for this farmer:{" "}
                    {selectedFarmer.maxCreditLimit.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    })}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Tenor (months)
                </label>
                <input
                  type="number"
                  min={3}
                  max={36}
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm outline-none ring-emerald-500 focus:bg-white focus:ring-1 dark:border-zinc-700 dark:bg-zinc-900"
                  value={form.values.tenorMonths ?? 12}
                  onChange={(event) =>
                    handleChange("tenorMonths", Number(event.target.value))
                  }
                />
                {form.errors.tenorMonths ? (
                  <p className="mt-1 text-xs text-red-500">
                    {form.errors.tenorMonths}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-700/40"
          >
            Fund loan note
          </button>

          {form.errors.root ? (
            <p className="text-xs text-red-500">{form.errors.root}</p>
          ) : null}
        </form>

        <div className="space-y-4">
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Funded note
            </h2>
            {!createdNote || !selectedFarmer || !selectedVault ? (
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                Once you fund a loan, this panel shows the on-chain style note
                metadata: principal, rate, tenor and which vault carries the
                exposure.
              </p>
            ) : (
              <div className="mt-3 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                <p className="font-mono text-[0.7rem] text-zinc-500">
                  noteId: {createdNote.id}
                </p>
                <p>
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">
                    Farmer:
                  </span>{" "}
                  {selectedFarmer.name} · Tier {selectedFarmer.riskTier}
                </p>
                <p>
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">
                    Vault:
                  </span>{" "}
                  {selectedVault.name} ({selectedVault.riskBand})
                </p>
                <p>
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">
                    Principal:
                  </span>{" "}
                  {createdNote.principal.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p>
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">
                    Tenor:
                  </span>{" "}
                  {createdNote.tenorMonths} months
                </p>
                <p>
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">
                    Rate:
                  </span>{" "}
                  {(createdNote.rate * 100).toFixed(1)}% p.a.
                </p>
                <p>
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">
                    Outstanding:
                  </span>{" "}
                  {createdNote.outstanding.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
            <p className="font-medium text-zinc-700 dark:text-zinc-300">
              How this maps to contracts
            </p>
            <p className="mt-1">
              In a full Rayls deployment this screen would call your{" "}
              <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-[0.7rem] text-zinc-100">
                fundNote()
              </code>{" "}
              method on the selected{" "}
              <span className="font-semibold">AgroVault</span> and emit a
              loan token ID. Here we just mint the note in React state so
              you can walk investors through the story without touching a
              testnet.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}



