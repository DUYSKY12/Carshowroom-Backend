import { config } from "../../config/env.js";
import logger from "../../config/logger.js";
import { MockAiProvider } from "./providers/mockProvider.js";
import { GeminiProvider } from "./providers/geminiProvider.js";
import { OpenAiProvider } from "./providers/openaiProvider.js";

let providerInstance = null;

export function getAiProvider() {
  if (providerInstance) return providerInstance;

  const providerType = (config.aiProvider || "mock").toLowerCase();
  const apiKey = config.aiApiKey;
  const model = config.aiModel;

  if (providerType === "gemini") {
    if (!apiKey) {
      logger.warn("AI_PROVIDER is set to 'gemini' but AI_API_KEY is missing. Falling back to MockAiProvider.");
      providerInstance = new MockAiProvider();
    } else {
      logger.info(`Initialized Gemini AI Provider with model: ${model || "gemini-2.0-flash"}`);
      providerInstance = new GeminiProvider(apiKey, model || "gemini-2.0-flash");
    }
  } else if (providerType === "openai") {
    if (!apiKey) {
      logger.warn("AI_PROVIDER is set to 'openai' but AI_API_KEY is missing. Falling back to MockAiProvider.");
      providerInstance = new MockAiProvider();
    } else {
      logger.info(`Initialized OpenAI Provider with model: ${model || "gpt-4o-mini"}`);
      providerInstance = new OpenAiProvider(apiKey, model || "gpt-4o-mini");
    }
  } else {
    logger.info("Using intelligent Mock AI Provider (offline mode)");
    providerInstance = new MockAiProvider();
  }

  return providerInstance;
}
