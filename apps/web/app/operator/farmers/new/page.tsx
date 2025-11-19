"use client";

import { useState } from "react";
import { z } from "zod";
import {
  UnderwriteRequestSchema,
  type UnderwriteRequest,
  type UnderwriteResponse,
  cropTypes,
  regions,
  farmerRiskTiers,
  type Farmer,
} from "@/app/lib/schemas";
import { mockUnderwrite } from "@/app/lib/mock-services";
import { useDemo } from "@/app/lib/demo-context";

type UnderwriteFormState = {
  values: Partial<UnderwriteRequest>;
  errors: Record<string, string>;
  submitting: boolean;
};

const emptyForm: UnderwriteFormState = {
  values: {
    name: "",
    documentId: "",
    region: undefined,
    cropType: undefined,
    requestedAmount: undefined,
    tenorMonths: 12,
    hectares: undefined,
    historicalYieldTonsPerHectare: undefined,
    coopMember: false,
  },
  errors: {},
  submitting: false,
};

function parseForm(values: UnderwriteFormState["values"]): UnderwriteRequest {
  const coerceNumber = (value: unknown) =>
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim().length > 0
        ? Number(value)
        : NaN;

  const payload: UnderwriteRequest = {
    name: values.name ?? "",
    documentId: values.documentId ?? "",
    region: (values.region ??
      regions[0]) as UnderwriteRequest["region"],
    cropType: (values.cropType ??
      cropTypes[0]) as UnderwriteRequest["cropType"],
    requestedAmount: coerceNumber(values.requestedAmount),
    tenorMonths:
      typeof values.tenorMonths === "number"
        ? values.tenorMonths
        : Number(values.tenorMonths ?? 12),
    hectares: coerceNumber(values.hectares),
    historicalYieldTonsPerHectare: coerceNumber(
      values.historicalYieldTonsPerHectare,
    ),
    coopMember: Boolean(values.coopMember),
  };

  return payload;
}

export default function NewFarmerPage() {
  const { addFarmer } = useDemo();
  const [form, setForm] = useState<UnderwriteFormState>(emptyForm);
  const [result, setResult] = useState<UnderwriteResponse | null>(null);
  const [registeredFarmer, setRegisteredFarmer] = useState<Farmer | null>(null);

  const handleChange = (
    field: keyof UnderwriteFormState["values"],
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setRegisteredFarmer(null);

    const parsed = UnderwriteRequestSchema.safeParse(
      parseForm(form.values),
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

    setForm((prev) => ({ ...prev, submitting: true }));
    setResult(null);

    try {
      const response = await mockUnderwrite(parsed.data);
      setResult(response);
    } catch (error) {
      setForm((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          root: "Failed to run underwriting. This is a demo-only client-side mock.",
        },
      }));
    } finally {
      setForm((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleRegisterFarmer = () => {
    if (!result) return;

    const parsed = UnderwriteRequestSchema.safeParse(
      parseForm(form.values),
    );

    if (!parsed.success) {
      return;
    }

    const farmer: Farmer = {
      id: `farmer-${Date.now()}`,
      name: parsed.data.name,
      region: parsed.data.region,
      cropType: parsed.data.cropType,
      riskTier: result.riskTier,
      maxCreditLimit: result.maxCreditLimit,
      metadataURI: undefined,
    };

    addFarmer(farmer);
    setRegisteredFarmer(farmer);
  };

  const disableApprove =
    !result ||
    form.submitting ||
    (registeredFarmer && registeredFarmer.name === form.values.name);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-10 lg:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
          Flow A · Operator
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Underwrite &amp; Approve Farmer
        </h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Capture the core KYC + agronomic data, run an AI-style underwriting
          call, then register the farmer into an on-chain registry. All calls
          here are mocked on the client to keep the demo self-contained.
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
                Farmer name
              </label>
              <input
                type="text"
                className="mt-1 w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm outline-none ring-emerald-500 focus:bg-white focus:ring-1 dark:border-zinc-700 dark:bg-zinc-900"
                value={form.values.name ?? ""}
                onChange={(event) =>
                  handleChange("name", event.target.value)
                }
              />
              {form.errors.name ? (
                <p className="mt-1 text-xs text-red-500">
                  {form.errors.name}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  CPF/CNPJ or document ID
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm outline-none ring-emerald-500 focus:bg-white focus:ring-1 dark:border-zinc-700 dark:bg-zinc-900"
                  value={form.values.documentId ?? ""}
                  onChange={(event) =>
                    handleChange("documentId", event.target.value)
                  }
                />
                {form.errors.documentId ? (
                  <p className="mt-1 text-xs text-red-500">
                    {form.errors.documentId}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Region
                </label>
                <select
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm outline-none ring-emerald-500 focus:bg-white focus:ring-1 dark:border-zinc-700 dark:bg-zinc-900"
                  value={form.values.region ?? ""}
                  onChange={(event) =>
                    handleChange("region", event.target.value)
                  }
                >
                  <option value="">Select region</option>
                  {regions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
                {form.errors.region ? (
                  <p className="mt-1 text-xs text-red-500">
                    {form.errors.region}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Crop type
                </label>
                <select
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm outline-none ring-emerald-500 focus:bg-white focus:ring-1 dark:border-zinc-700 dark:bg-zinc-900"
                  value={form.values.cropType ?? ""}
                  onChange={(event) =>
                    handleChange("cropType", event.target.value)
                  }
                >
                  <option value="">Select crop</option>
                  {cropTypes.map((crop) => (
                    <option key={crop} value={crop}>
                      {crop}
                    </option>
                  ))}
                </select>
                {form.errors.cropType ? (
                  <p className="mt-1 text-xs text-red-500">
                    {form.errors.cropType}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Hectares financed
                </label>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm outline-none ring-emerald-500 focus:bg-white focus:ring-1 dark:border-zinc-700 dark:bg-zinc-900"
                  value={form.values.hectares ?? ""}
                  onChange={(event) =>
                    handleChange("hectares", event.target.value)
                  }
                />
                {form.errors.hectares ? (
                  <p className="mt-1 text-xs text-red-500">
                    {form.errors.hectares}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Requested amount (BRL)
                </label>
                <input
                  type="number"
                  min={1}
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm outline-none ring-emerald-500 focus:bg-white focus:ring-1 dark:border-zinc-700 dark:bg-zinc-900"
                  value={form.values.requestedAmount ?? ""}
                  onChange={(event) =>
                    handleChange("requestedAmount", event.target.value)
                  }
                />
                {form.errors.requestedAmount ? (
                  <p className="mt-1 text-xs text-red-500">
                    {form.errors.requestedAmount}
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

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Hist. yield (t/ha)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm outline-none ring-emerald-500 focus:bg-white focus:ring-1 dark:border-zinc-700 dark:bg-zinc-900"
                  value={form.values.historicalYieldTonsPerHectare ?? ""}
                  onChange={(event) =>
                    handleChange(
                      "historicalYieldTonsPerHectare",
                      event.target.value,
                    )
                  }
                />
                {form.errors.historicalYieldTonsPerHectare ? (
                  <p className="mt-1 text-xs text-red-500">
                    {form.errors.historicalYieldTonsPerHectare}
                  </p>
                ) : null}
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                className="h-3 w-3 rounded border border-zinc-400 text-emerald-600 focus:ring-emerald-500"
                checked={Boolean(form.values.coopMember)}
                onChange={(event) =>
                  handleChange("coopMember", event.target.checked)
                }
              />
              Member of partner coop / integrator
            </label>

            {form.errors.root ? (
              <p className="mt-1 text-xs text-red-500">{form.errors.root}</p>
            ) : null}
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-700/40"
            disabled={form.submitting}
          >
            {form.submitting ? "Running underwriting..." : "Run underwriting"}
          </button>
        </form>

        <div className="space-y-4">
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Underwriting result
            </h2>
            {!result ? (
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                Submit the form to see risk tier, band, max credit limit and
                an explanation from the Rayls-style underwriting engine.
              </p>
            ) : (
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-900">
                    Tier {result.riskTier} · {result.riskBand}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-zinc-50 px-3 py-1 font-medium text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700">
                    Rate ~ {(result.rate * 100).toFixed(1)}% per year
                  </span>
                  <span className="inline-flex items-center rounded-full bg-zinc-50 px-3 py-1 text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700">
                    Max credit limit: BRL{" "}
                    {result.maxCreditLimit.toLocaleString("en-US")}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-zinc-50 px-3 py-1 text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700">
                    Confidence {(result.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                {result.flags.length ? (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Flags
                    </p>
                    <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                      {result.flags.map((flag) => (
                        <li key={flag}>• {flag}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {result.explanation}
                </p>

                <button
                  type="button"
                  className="mt-2 inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-800/40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  onClick={handleRegisterFarmer}
                  disabled={disableApprove}
                >
                  Approve &amp; register farmer
                </button>

                {registeredFarmer ? (
                  <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                    Farmer registered in demo registry as{" "}
                    <span className="font-semibold">
                      {registeredFarmer.name}
                    </span>{" "}
                    with tier {registeredFarmer.riskTier} and max credit limit
                    BRL{" "}
                    {registeredFarmer.maxCreditLimit.toLocaleString(
                      "en-US",
                    )}
                    .
                  </p>
                ) : null}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
            <p className="font-medium text-zinc-700 dark:text-zinc-300">
              Demo notes
            </p>
            <p className="mt-1">
              In the full Rayls integration this screen would POST to{" "}
              <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-[0.7rem] text-zinc-100">
                /underwrite
              </code>{" "}
              on your backend and then send a transaction to your{" "}
              <span className="font-semibold">FarmerRegistry</span>{" "}
              contract. For now, everything happens in local React state so
              you can demo the full flow without deploying contracts.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}



