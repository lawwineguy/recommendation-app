import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export function getModel() {
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}

export function getVisionModel() {
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}
