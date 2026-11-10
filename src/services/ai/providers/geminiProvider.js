import { GoogleGenerativeAI } from "@google/generative-ai";
import logger from "../../../config/logger.js";

/**
 * Google Gemini AI Provider
 * Supports gemini-2.0-flash, gemini-1.5-pro, etc.
 */
export class GeminiProvider {
  constructor(apiKey, modelName = "gemini-2.0-flash") {
    if (!apiKey) {
      throw new Error("Gemini API key is required");
    }
    this.name = "gemini";
    this.modelName = modelName || "gemini-2.0-flash";
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generateText(prompt, systemInstruction = "") {
    try {
      const model = this.client.getGenerativeModel({
        model: this.modelName,
        systemInstruction: systemInstruction || undefined
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (err) {
      logger.error(`[Gemini Provider Error]: ${err.message}`);
      throw new Error(`Lỗi gọi Gemini AI: ${err.message}`);
    }
  }

  async chat(messages, systemInstruction = "") {
    try {
      const model = this.client.getGenerativeModel({
        model: this.modelName,
        systemInstruction: systemInstruction || undefined
      });

      // Convert standard message format to Gemini format
      // Gemini expects history formatted as { role: 'user' | 'model', parts: [{ text }] }
      const history = [];
      const messagesToFormat = messages.slice(0, -1);
      const lastMsg = messages[messages.length - 1];

      for (const msg of messagesToFormat) {
        history.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }]
        });
      }

      const chatSession = model.startChat({ history });
      const result = await chatSession.sendMessage(lastMsg.content);
      const response = await result.response;
      return response.text();
    } catch (err) {
      logger.error(`[Gemini Chat Error]: ${err.message}`);
      throw new Error(`Lỗi hội thoại Gemini AI: ${err.message}`);
    }
  }
}
