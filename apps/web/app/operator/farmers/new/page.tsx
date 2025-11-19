//app/operator/farmers/new/page.tsx
"use client";

import { useState } from "react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Activity,
  Check,
  AlertTriangle,
  Sprout,
  Banknote,
} from "lucide-react";
import {
  UnderwriteRequestSchema,
  type UnderwriteRequest,
  type UnderwriteResponse,
  cropTypes,
  regions,
  type Farmer,
} from "@/app/lib/schemas";
import { mockUnderwrite } from "@/app/lib/mock-services";
import { useDemo } from "@/app/lib/demo-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ... schema imports ...

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
    region: (values.region ?? regions[0]) as UnderwriteRequest["region"],
    cropType: (values.cropType ??
      cropTypes[0]) as UnderwriteRequest["cropType"],
    requestedAmount: coerceNumber(values.requestedAmount),
    tenorMonths:
      typeof values.tenorMonths === "number"
        ? values.tenorMonths
        : Number(values.tenorMonths ?? 12),
    hectares: coerceNumber(values.hectares),
    historicalYieldTonsPerHectare: coerceNumber(
      values.historicalYieldTonsPerHectare
    ),
    coopMember: Boolean(values.coopMember),
  };

  return payload;
}

export default function UnderwritingPage() {
  const { addFarmer } = useDemo();
  const [form, setForm] = useState<UnderwriteFormState>(emptyForm);
  const [result, setResult] = useState<UnderwriteResponse | null>(null);
  const [registeredFarmer, setRegisteredFarmer] = useState<Farmer | null>(null);

  const handleChange = (
    field: keyof UnderwriteFormState["values"],
    value: unknown
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

    console.log("Form submitted, current values:", form.values);
    const parsedInput = parseForm(form.values);
    console.log("Parsed form data:", parsedInput);
    
    const parsed = UnderwriteRequestSchema.safeParse(parsedInput);

    if (!parsed.success) {
      console.error("Validation failed:", parsed.error.issues);
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      });
      setForm((prev) => ({ ...prev, errors: fieldErrors }));
      return;
    }
    
    console.log("Validation passed, sending to API:", parsed.data);

    setForm((prev) => ({ ...prev, submitting: true }));
    setResult(null);

    try {
      // Simulate AI delay
      // await new Promise((resolve) => setTimeout(resolve, 1500));
      // const response = await mockUnderwrite(parsed.data);

      const res = await fetch('/api/underwrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('API Error Details:', errorData);
        throw new Error(errorData.error || `Failed to analyze credit risk: ${res.status}`);
      }

      const json = await res.json();
      
      // The API returns { data: savedDoc, aiAnalysis: ... }
      // We want the AI analysis part to populate the result view
      setResult(json.aiAnalysis);
    } catch (error) {
      console.error("Form submission error:", error);
      setForm((prev) => ({
        ...prev,
        errors: { ...prev.errors, root: "Analysis failed. Please try again." },
      }));
    } finally {
      setForm((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleRegisterFarmer = () => {
    if (!result) return;
    const parsed = UnderwriteRequestSchema.safeParse(parseForm(form.values));
    if (!parsed.success) return;

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

  return (
    <div className="flex min-h-screen bg-rayls-black text-white font-sans">
      {/* LEFT: Input Panel */}
      <div className="w-full lg:w-1/2 p-8 lg:p-12 border-r border-rayls-border overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            Origination Desk
          </h1>
          <p className="text-rayls-grey text-sm">
            Enter farmer details to generate AI-driven credit risk thesis.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section: Identity */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-rayls-lime uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Identity & Privacy
            </h2>
            <div className="grid gap-4">
              <div>
                <label className="block text-xs font-medium text-rayls-grey mb-1">
                  CPF Hash (Privacy Preserved)
                </label>
                <Input
                  placeholder="0x..."
                  value={form.values.documentId ?? ""}
                  onChange={(e) => handleChange("documentId", e.target.value)}
                  className="font-mono"
                />
                {form.errors.documentId && (
                  <p className="text-xs text-red-500 mt-1">
                    {form.errors.documentId}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-rayls-grey mb-1">
                  Farmer Legal Name (Off-chain)
                </label>
                <Input
                  value={form.values.name ?? ""}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
                {form.errors.name && (
                  <p className="text-xs text-red-500 mt-1">
                    {form.errors.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Crop & Land */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-rayls-lime uppercase tracking-wider flex items-center gap-2">
              <Sprout className="h-4 w-4" /> Crop & Land Data
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-rayls-grey mb-1">
                  Region
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-rayls-border bg-rayls-input px-3 py-2 text-sm text-white focus:ring-2 focus:ring-rayls-lime outline-none"
                  value={form.values.region ?? ""}
                  onChange={(e) => handleChange("region", e.target.value)}
                >
                  <option value="">Select...</option>
                  {regions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-rayls-grey mb-1">
                  Crop Type
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-rayls-border bg-rayls-input px-3 py-2 text-sm text-white focus:ring-2 focus:ring-rayls-lime outline-none"
                  value={form.values.cropType ?? ""}
                  onChange={(e) => handleChange("cropType", e.target.value)}
                >
                  <option value="">Select...</option>
                  {cropTypes.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-rayls-grey mb-1">
                  Hectares
                </label>
                <Input
                  type="number"
                  value={form.values.hectares ?? ""}
                  onChange={(e) => handleChange("hectares", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-rayls-grey mb-1">
                  Hist. Yield (t/ha)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.values.historicalYieldTonsPerHectare ?? ""}
                  onChange={(e) =>
                    handleChange(
                      "historicalYieldTonsPerHectare",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>
          </div>

          {/* Section: Financial Request */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-rayls-lime uppercase tracking-wider flex items-center gap-2">
              <Banknote className="h-4 w-4" /> Financial Request
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-rayls-grey mb-1">
                  Amount (BRL)
                </label>
                <Input
                  type="number"
                  value={form.values.requestedAmount ?? ""}
                  onChange={(e) =>
                    handleChange("requestedAmount", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-rayls-grey mb-1">
                  Tenor (Months)
                </label>
                <Input
                  type="number"
                  value={form.values.tenorMonths ?? 12}
                  onChange={(e) =>
                    handleChange("tenorMonths", Number(e.target.value))
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-rayls-grey cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-rayls-border bg-rayls-input text-rayls-lime focus:ring-rayls-lime"
                checked={Boolean(form.values.coopMember)}
                onChange={(e) => handleChange("coopMember", e.target.checked)}
              />
              Member of partner cooperative
            </label>
          </div>

          <Button
            type="submit"
            disabled={form.submitting}
            className="w-full bg-rayls-lime text-black hover:bg-rayls-lime/90 font-bold"
          >
            {form.submitting ? (
              <Activity className="animate-spin mr-2" />
            ) : null}
            {form.submitting ? "Analyzing..." : "Analyze Credit Risk"}
          </Button>

          {/* Error Message Display */}
          {form.errors.root && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md flex items-center gap-2 text-red-500 text-sm">
              <AlertTriangle className="h-4 w-4" />
              {form.errors.root}
            </div>
          )}
        </form>
      </div>

      {/* RIGHT: AI Command Center */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black items-center justify-center p-12">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[40px_40px]" />

        <AnimatePresence mode="wait">
          {!result && !form.submitting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-rayls-grey/50"
            >
              <div className="border border-rayls-border/30 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-4">
                <Activity className="h-12 w-12" />
              </div>
              <p>Awaiting Input Data...</p>
            </motion.div>
          )}

          {form.submitting && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                <motion.div
                  className="absolute inset-0 border-t-2 border-rayls-lime rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <div className="text-2xl font-mono text-rayls-lime">AI</div>
              </div>
              <p className="text-rayls-lime animate-pulse font-mono">
                COMPUTING RISK VECTOR...
              </p>
            </motion.div>
          )}

          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              className="w-full max-w-md z-10"
            >
              <Card className="border-rayls-purple/50 bg-rayls-charcoal shadow-[0_0_30px_rgba(157,140,252,0.15)]">
                <div className="p-6 space-y-6">
                  {/* Header with Privacy Badge */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-rayls-grey text-xs uppercase tracking-widest">
                        Risk Assessment
                      </h3>
                      <div className="text-2xl font-bold text-white mt-1">
                        Credit Scorecard
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="gap-1 bg-rayls-purple/20 text-rayls-purple border-rayls-purple/50"
                    >
                      <Lock className="h-3 w-3" /> ZK-Verified
                    </Badge>
                  </div>

                  {/* Credit Score Gauge */}
                  <div className="flex items-center justify-between border-b border-rayls-border pb-6">
                    <div className="relative h-24 w-24 flex items-center justify-center rounded-full border-4 border-rayls-lime/20">
                      <div className="absolute inset-0 rounded-full border-4 border-rayls-lime border-l-transparent rotate-45" />
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white">850</div>
                        <div className="text-[10px] text-rayls-grey">
                          / 1000
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-rayls-grey uppercase">
                          Risk Tier
                        </span>
                        <span className="text-xl font-bold text-rayls-lime">
                          {result.riskTier} - {result.riskBand}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-rayls-grey uppercase">
                          Max Limit
                        </span>
                        <span className="text-lg font-mono text-white">
                          R$ {result.maxCreditLimit.toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Thesis */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2">
                      AI Risk Thesis
                    </h4>
                    <p className="text-sm text-rayls-grey leading-relaxed">
                      {result.explanation}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-4">
                    <Button
                      onClick={handleRegisterFarmer}
                      disabled={!!registeredFarmer}
                      className="w-full bg-white text-black hover:bg-gray-200 font-bold"
                    >
                      {registeredFarmer ? (
                        <>
                          <Check className="mr-2 h-4 w-4" /> Authenticated on
                          Chain
                        </>
                      ) : (
                        "Approve & Register on Rayls"
                      )}
                    </Button>
                    {registeredFarmer && (
                      <p className="text-center text-[10px] text-rayls-lime mt-2 animate-pulse">
                        Transaction Confirmed: {registeredFarmer.id}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
