import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  VaultAiSummaryRequestSchema,
  VaultAiSummaryResponseSchema,
  type VaultAiSummaryRequest,
  type VaultAiSummaryResponse,
} from "@/app/lib/schemas";

type ErrorCode =
  | "INVALID_JSON"
  | "VALIDATION_FAILED"
  | "OPENAI_NOT_CONFIGURED"
  | "OPENAI_ERROR";

type ErrorEnvelope = {
  code: ErrorCode;
  message: string;
  details: unknown;
  correlationId: string;
};

type SuccessEnvelope = {
  data: VaultAiSummaryResponse;
  correlationId: string;
};

function createCorrelationId() {
  // crypto is available in the Edge/Node runtimes used by Next 16
  return crypto.randomUUID();
}

function errorResponse(
  status: number,
  code: ErrorCode,
  message: string,
  details: unknown = {}
) {
  const correlationId = createCorrelationId();
  const body: ErrorEnvelope = {
    code,
    message,
    details,
    correlationId,
  };

  return NextResponse.json(body, { status });
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return errorResponse(
      500,
      "OPENAI_NOT_CONFIGURED",
      "AI vault summary is not configured on this deployment."
    );
  }

  let body: VaultAiSummaryRequest;

  try {
    const json = await req.json();
    const parsed = VaultAiSummaryRequestSchema.safeParse(json);

    if (!parsed.success) {
      return errorResponse(
        400,
        "VALIDATION_FAILED",
        "Invalid payload for vault AI summary.",
        { issues: parsed.error.issues }
      );
    }

    body = parsed.data;
  } catch {
    return errorResponse(
      400,
      "INVALID_JSON",
      "Request body must be valid JSON.",
      {}
    );
  }

  const { vault, notes } = body;

  const noteCount = notes.length;
  const totalPrincipal = notes.reduce((acc, note) => acc + note.principal, 0);
  const totalOutstanding = notes.reduce(
    (acc, note) => acc + note.outstanding,
    0
  );
  const avgRate =
    noteCount === 0
      ? 0
      : notes.reduce((acc, note) => acc + note.rate, 0) / noteCount;
  const avgTenorMonths =
    noteCount === 0
      ? 0
      : notes.reduce((acc, note) => acc + note.tenorMonths, 0) / noteCount;

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const completion = await openai.chat.completions.create({
      // Allow overriding via env if needed
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are an institutional credit strategist for an on-chain credit platform. " +
            "Summarize vaults for professional investors in 3–5 concise sentences, then propose 3–4 key highlights. " +
            "Be specific, numeric where possible, and keep the tone neutral and informative (no marketing hype). " +
            "Focus on risk/return profile, diversification, and loan book quality.",
        },
        {
          role: "user",
          content: [
            "Generate a JSON object with the following shape:",
            "{",
            '  "summary": string,',
            '  "highlights": [',
            '    { "label": string, "value": string, "sentiment": "positive" | "neutral" | "negative" }',
            "  ],",
            '  "riskOverview"?: string',
            "}",
            "",
            "Vault data:",
            JSON.stringify(
              {
                vault: {
                  id: vault.id,
                  name: vault.name,
                  description: vault.description,
                  riskBand: vault.riskBand,
                  baseApr: vault.baseApr,
                  tvl: vault.tvl,
                  cropTypes: vault.cropTypes,
                },
                aggregates: {
                  noteCount,
                  totalPrincipal,
                  totalOutstanding,
                  avgRate,
                  avgTenorMonths,
                },
              },
              null,
              2
            ),
            "",
            "Important formatting rules:",
            "- Respond with JSON only, no markdown, no extra commentary.",
            "- Keep values short and skimmable (e.g. '2 active loans', '12.0% target net yield').",
          ].join("\n"),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return errorResponse(
        500,
        "OPENAI_ERROR",
        "AI did not return a usable response."
      );
    }

    let raw: unknown;

    try {
      raw = JSON.parse(content);
    } catch (parseError) {
      return errorResponse(
        500,
        "OPENAI_ERROR",
        "Failed to parse AI response.",
        {}
      );
    }

    const parsedResponse = VaultAiSummaryResponseSchema.safeParse(raw);

    if (!parsedResponse.success) {
      return errorResponse(
        500,
        "OPENAI_ERROR",
        "AI response did not match expected schema.",
        { issues: parsedResponse.error.issues }
      );
    }

    const correlationId = createCorrelationId();
    const body: SuccessEnvelope = {
      data: parsedResponse.data,
      correlationId,
    };

    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    return errorResponse(
      500,
      "OPENAI_ERROR",
      "Upstream AI provider failed to generate a summary.",
      {}
    );
  }
}


