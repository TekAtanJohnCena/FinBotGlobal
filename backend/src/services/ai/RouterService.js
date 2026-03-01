// PATH: backend/src/services/ai/RouterService.js
/**
 * LLM Router - Intent Classification via Claude 3 Haiku
 *
 * Fast classification of user messages into:
 * HISSE_ANALIZI | KARSILASTIRMA | PORTFOY | RISK_RADARI | REKABET_GUCU | AKILLI_PARA | GENEL
 */

import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { sanitizeUserPrompt } from "../../utils/promptSanitizer.js";

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || "us-east-1"
});

const HAIKU_MODEL_ID = process.env.HAIKU_MODEL_ID || "us.anthropic.claude-3-haiku-20240307-v1:0";
const ROUTER_TIMEOUT_MS = Number(process.env.ROUTER_TIMEOUT_MS) || 500;
const VALID_INTENTS = [
  "HISSE_ANALIZI",
  "KARSILASTIRMA",
  "PORTFOY",
  "RISK_RADARI",
  "REKABET_GUCU",
  "AKILLI_PARA",
  "TEMETTU_STRATEJISI",
  "TEKNIK_RADAR",
  "BUYUME_POTANSIYELI",
  "EMTIA_STRATEJISI",
  "KRIPTO_STRATEJISI",
  "JEOPOLITIK_RADAR",
  "GENEL"
];

const CLASSIFIER_SYSTEM_PROMPT = [
  "You are an intent classifier for FinBot.",
  "Output JSON only, exactly one object, no markdown, no extra text.",
  'Format: {"intent":"INTENT_NAME"}',
  "Rules:",
  "- HISSE_ANALIZI: single stock deep analysis",
  "- KARSILASTIRMA: compare 2+ stocks",
  "- PORTFOY: portfolio allocation, diversification",
  "- RISK_RADARI: stress test, hedging, drawdown",
  "- REKABET_GUCU: moat, competitive advantage, rivals",
  "- AKILLI_PARA: institutional flow, 13F, insider activity",
  "- TEMETTU_STRATEJISI: dividend yield, payout ratio, passive income",
  "- TEKNIK_RADAR: RSI, MACD, moving averages, support/resistance",
  "- BUYUME_POTANSIYELI: high growth, CAGR, 10Y future projections",
  "- EMTIA_STRATEJISI: gold, silver, oil, safe haven assets",
  "- KRIPTO_STRATEJISI: bitcoin, crypto, blockchain, digital assets",
  "- JEOPOLITIK_RADAR: war, news, global crisis, market news impact",
  "- GENEL: greetings, small talk, generic definitions",
  "- CRITICAL: If the user mentions 'portföy' (portfolio) in any context, the intent is ALWAYS PORTFOY.",
].join("\n");

function normalizeIntent(rawIntent) {
  const value = String(rawIntent || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z_]/g, "");
  return VALID_INTENTS.includes(value) ? value : "GENEL";
}

/**
 * Classify user intent using Claude 3 Haiku.
 * Returns one of: HISSE_ANALIZI | KARSILASTIRMA | PORTFOY | RISK_RADARI | REKABET_GUCU | AKILLI_PARA | GENEL
 *
 * @param {string} userMessage
 * @returns {Promise<string>}
 */
export async function classifyUserIntent(userMessage) {
  const sanitizedMessage = sanitizeUserPrompt(userMessage);
  if (!sanitizedMessage) return "GENEL";
  const startedAt = Date.now();

  console.log(
    `[Router][Haiku] Intent classify request started | model=${HAIKU_MODEL_ID} | timeout=${ROUTER_TIMEOUT_MS}ms`
  );

  const requestBody = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 32,
    temperature: 0,
    system: CLASSIFIER_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Classify this message:\n<USER_INPUT>\n${sanitizedMessage}\n</USER_INPUT>`
      }
    ]
  };

  const command = new InvokeModelCommand({
    modelId: HAIKU_MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(requestBody)
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ROUTER_TIMEOUT_MS);

  try {
    const response = await bedrockClient.send(command, { abortSignal: controller.signal });
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const rawText = (responseBody.content?.[0]?.text || "").trim();

    try {
      const parsed = JSON.parse(rawText);
      const intent = normalizeIntent(parsed?.intent);
      console.log(
        `[Router][Haiku] Intent classify success | intent=${intent} | elapsedMs=${Date.now() - startedAt}`
      );
      return intent;
    } catch {
      const intent = normalizeIntent(rawText);
      console.log(
        `[Router][Haiku] Intent classify success (non-json fallback) | intent=${intent} | raw="${rawText.slice(0, 80)}" | elapsedMs=${Date.now() - startedAt}`
      );
      return intent;
    }
  } catch (error) {
    if (error?.name === "AbortError") {
      console.warn(
        `[Router][Haiku] Timeout > ${ROUTER_TIMEOUT_MS}ms, defaulting to GENEL | elapsedMs=${Date.now() - startedAt}`
      );
      return "GENEL";
    }

    console.error(
      `[Router][Haiku] Classification failed, defaulting to GENEL | elapsedMs=${Date.now() - startedAt}:`,
      error.message
    );
    return "GENEL";
  } finally {
    clearTimeout(timeoutId);
  }
}

export default { classifyUserIntent };
