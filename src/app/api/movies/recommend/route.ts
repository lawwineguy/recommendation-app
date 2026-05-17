import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/gemini";

const SERVICE_BADGES: Record<string, string> = {
  netflix: "🔴 Netflix",
  hulu: "🟢 Hulu",
  "disney+": "🏰 Disney+",
  "apple tv+": "🍎 Apple TV+",
  max: "💜 Max",
  "amazon prime video": "📦 Prime Video",
};

export async function POST(req: NextRequest) {
  try {
    const { type, mood, services } = await req.json();

    const serviceList = (services as string[]).join(", ");

    const prompt = `I want to watch a ${type === "tv" ? "TV show" : "movie"}. My mood: ${mood}.

My active streaming services: ${serviceList}

CRITICAL INSTRUCTIONS:
- ONLY recommend titles that are currently included FREE with one of these streaming services: ${serviceList}
- Do NOT recommend titles that require additional purchase or rental

Recommend exactly 5 ${type === "tv" ? "TV shows" : "movies"} I should watch.

Respond in this exact JSON format:
[
  {
    "title": "Title",
    "service": "Streaming Service Name",
    "pitch": "One sentence pitch for why I'd love this",
    "genre": "Genre"
  }
]

Return ONLY the JSON array, no other text.`;

    const model = getModel();
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse recommendations" },
        { status: 500 }
      );
    }

    const recommendations = JSON.parse(jsonMatch[0]).map(
      (r: { service: string }) => ({
        ...r,
        serviceBadge:
          SERVICE_BADGES[r.service.toLowerCase()] || r.service,
      })
    );

    return NextResponse.json({ recommendations });
  } catch (err) {
    console.error("Movie recommend error:", err);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 }
    );
  }
}
