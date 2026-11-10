import OpenAI from "openai";
import logger from "../../../config/logger.js";

/**
 * OpenAI Provider
 * Supports gpt-4o, gpt-4o-mini, etc.
 */
export class OpenAiProvider {
  constructor(apiKey, modelName = "gpt-4o-mini") {
    if (!apiKey) {
      throw new Error("OpenAI API key is required");
    }
    this.name = "openai";
    this.modelName = modelName || "gpt-4o-mini";
    this.client = new OpenAI({ apiKey });
  }

  async generateText(prompt, systemInstruction = "") {
    try {
      const messages = [];
      if (systemInstruction) {
        messages.push({ role: "system", content: systemInstruction });
      }
      messages.push({ role: "user", content: prompt });

      const response = await this.client.chat.completions.create({
        model: this.modelName,
        messages,
        temperature: 0.7
      });

      return response.choices[0]?.message?.content || "";
    } catch (err) {
      logger.error(`[OpenAI Provider Error]: ${err.message}`);
      throw new Error(`Lỗi gọi OpenAI: ${err.message}`);
    }
  }

  async chat(messages, systemInstruction = "") {
    try {
      const formatted = [];
      if (systemInstruction) {
        formatted.push({ role: "system", content: systemInstruction });
      }

      for (const msg of messages) {
        formatted.push({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content
        });
      }

      const response = await this.client.chat.completions.create({
        model: this.modelName,
        messages: formatted,
        temperature: 0.7
      });

      return response.choices[0]?.message?.content || "";
    } catch (err) {
      logger.error(`[OpenAI Chat Error]: ${err.message}`);
      throw new Error(`Lỗi hội thoại OpenAI: ${err.message}`);
    }
  }
}
