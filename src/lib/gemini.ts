import { GoogleGenerativeAI, GenerativeModel, Part } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export function getModel() {
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

export function getVisionModel() {
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

export async function generateWithRetry(
  model: GenerativeModel,
  prompt: string | (string | Part)[],
  maxRetries = 3
) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = Array.isArray(prompt)
        ? await model.generateContent(prompt)
        : await model.generateContent(prompt);
      return result.response.text();
    } catch (err: unknown) {
      const is503 =
        err instanceof Error &&
        (err.message.includes("503") ||
          err.message.includes("UNAVAILABLE") ||
          err.message.includes("overloaded"));
      if (is503 && attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
}
