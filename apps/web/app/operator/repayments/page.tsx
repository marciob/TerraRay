"use client";

import { useMemo, useState } from "react";
import { RepaymentSchema, type RepaymentPayload } from "@/app/lib/schemas";
import { useDemo } from "@/app/lib/demo-context";

type RepaymentFormState = {
  values: Partial<RepaymentPayload>;
  errors: Record<string, string>;
};

const emptyRepaymentForm: RepaymentFormState = {
  values: {
    noteId: "",
    amount: undefined,
  },
  errors: {},
};

function parseRepaymentForm(
  values: RepaymentFormState["values"],
): RepaymentPayload {
  const coerceNumber = (value: unknown) =>
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim().length > 0
        ? Number(value)
        : NaN;

  return {
    noteId: values.noteId ?? "",
    amount: coerceNumber(values.amount),
  };
}

export default function RepaymentsPage() {
  const { notes, farmers, vaults, recordRepayment } = useDemo();
  const [form, setForm] = useState<RepaymentFormState>(emptyRepaymentForm);
  const [lastRepaidId, setLastRepaidId] = useState<string | null>(null);

  const activeNotes = useMemo(
    () => notes.filter((note) => note.status === "Active"),
    [notes],
  );

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === form.values.noteId),
    [notes, form.values.noteId],
  );

  const selectedFarmer = useMemo(
    () =>
      selectedNote
        ? farmers.find((farmer) => farmer.id === selectedNote.farmerId)
        : undefined,
    [farmers, selectedNote],
  );

  const selectedVault = useMemo(
    () =>
      selectedNote
        ? vaults.find((vault) => vault.id === selectedNote.vaultId)
        : undefined,
    [vaults, selectedNote],
  );

  const handleChange = (
    field: keyof RepaymentFormState["values"],
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
    setLastRepaidId(null);

    const parsed = RepaymentSchema.safeParse(
      parseRepaymentForm(form.values),
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

    const note = notes.find(
      (candidate) => candidate.id === (parsed.success ? parsed.data.noteId : form.values.noteId),
    );

    if (parsed.success && note) {
      if (parsed.data.amount > note.outstanding) {
        errors.amount = `Repayment exceeds outstanding of BRL ${note.outstanding.toLocaleString(
          "en-US",
        )}`;
      }
    }

    if (Object.keys(errors).length > 0 || !parsed.success || !note) {
      setForm((prev) => ({
        ...prev,
        errors: Object.keys(errors).length > 0 ? errors : prev.errors,
      }));
      return;
    }

    recordRepayment(parsed.data.noteId, parsed.data.amount);
    setLastRepaidId(parsed.data.noteId);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-10 lg:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
          Flow D · Operator
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Record Repayment &amp; Update Yield
        </h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Choose an active note, input a repayment amount and push it through
          the vault. TVL is updated and investors&apos; positions reflect the
          improved performance of the pool.
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
                Active note
              </label>
              <select
                className="mt-1 w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm outline-none ring-emerald-500 focus:bg-white focus:ring-1 dark:border-zinc-700 dark:bg-zinc-900"
                value={form.values.noteId ?? ""}
                onChange={(event) =>
                  handleChange("noteId", event.target.value)
                }
              >
                <option value="">Select active note</option>
                {activeNotes.map((note) => {
                  const farmer = farmers.find(
                    (candidate) => candidate.id === note.farmerId,
                  );
                  const vault = vaults.find(
                    (candidate) => candidate.id === note.vaultId,
                  );

                  return (
                    <option key={note.id} value={note.id}>
                      {note.id} · {farmer?.name ?? "Farmer"} ·{" "}
                      {vault?.name ?? "Vault"} · Outst.{" "}
                      {note.outstanding.toLocaleString("en-US", {
                        style: "currency",
                        currency: "BRL",
                        maximumFractionDigits: 0,
                      })}
                    </option>
                  );
                })}
              </select>
              {form.errors.noteId ? (
                <p className="mt-1 text-xs text-red-500">
                  {form.errors.noteId}
                </p>
              ) : null}
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Repayment amount (BRL)
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
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-700/40"
          >
            Record repayment
          </button>
        </form>

        <div className="space-y-4">
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Note status &amp; vault impact
            </h2>

            {!selectedNote || !selectedFarmer || !selectedVault ? (
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                Select a note on the left to see the farmer, vault and
                outstanding balance. Recording a repayment will reduce the
                note&apos;s outstanding and increase the vault&apos;s TVL
                in the demo state.
              </p>
            ) : (
              <div className="mt-3 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                <p className="font-mono text-[0.7rem] text-zinc-500">
                  noteId: {selectedNote.id}
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
                  {selectedVault.name}
                </p>
                <p>
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">
                    Outstanding:
                  </span>{" "}
                  {selectedNote.outstanding.toLocaleString("en-US", {
                    style: "currency",
                    currency: "BRL",
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p>
                  <span className="font-medium text-zinc-800 dark:text-zinc-100">
                    Status:
                  </span>{" "}
                  {selectedNote.status}
                </p>
              </div>
            )}

            {lastRepaidId && selectedNote && selectedNote.id === lastRepaidId ? (
              <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400">
                Repayment recorded in demo state. The investor vault screens
                now see a higher TVL and improved position for this pool.
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
            <p className="font-medium text-zinc-700 dark:text-zinc-300">
              Contract mapping
            </p>
            <p className="mt-1">
              In your contracts this would call{" "}
              <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-[0.7rem] text-zinc-100">
                recordRepayment()
              </code>{" "}
              on the{" "}
              <span className="font-semibold">AgroVault</span>, update{" "}
              <span className="font-semibold">totalAssets()</span> and emit
              events that Rayls can listen to. For the hackathon demo this
              is all simulated in React state, but the UX matches the real
              flow closely.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}



