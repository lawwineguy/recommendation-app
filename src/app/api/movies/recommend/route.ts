import { NextRequest, NextResponse } from "next/server";
import { getModel, generateWithRetry } from "@/lib/gemini";

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
    const { type, mood, services, watchHistory, count, excludeTitles } = await req.json();

    const serviceList = (services as string[]).join(", ");
    const numRecs = count || 5;

    const historyItems = (watchHistory || []) as {
      title: string;
      type: string;
      genre: string;
      rating?: number;
    }[];

    const watchedTitles = historyItems.map((h) => h.title);
    const explicitExcludes = (excludeTitles || []) as string[];
    const allExcluded = [...new Set([...watchedTitles, ...explicitExcludes])];

    let historyContext = "";
    if (historyItems.length > 0) {
      const ratedItems = historyItems.filter((h) => h.rating);
      if (ratedItems.length > 0) {
        const ratedList = ratedItems
          .map((h) => `"${h.title}" (${h.type}, ${h.genre}) — ${h.rating}/5 stars`)
          .join("\n");
        historyContext = `\n\nHere are my ratings for things I've watched:\n${ratedList}\n\nWeight recommendations toward titles similar to my 4-5 star rated ones. Avoid recommending things similar to my 1-2 star rated ones.`;
      }
    }

    const excludeClause = allExcluded.length
      ? `\n\nDo NOT recommend any of these titles I've already watched: ${allExcluded.map((t) => `"${t}"`).join(", ")}`
      : "";

    const prompt = `I want to watch a ${type === "tv" ? "TV show" : "movie"}. My mood: ${mood}.

My active streaming services: ${serviceList}

CRITICAL INSTRUCTIONS:
- ONLY recommend titles that are currently included FREE with one of these streaming services: ${serviceList}
- Do NOT recommend titles that require additional purchase or rental${historyContext}${excludeClause}

Recommend exactly ${numRecs} ${type === "tv" ? "TV shows" : "movies"} I should watch.
Do not recommend the same title more than once. Each recommendation must be unique.

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
    const text = await generateWithRetry(model, prompt);

    let parsed: unknown[];
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      parsed = JSON.parse(arrayMatch[0]);
    } else {
      const objMatch = text.match(/\{[\s\S]*\}/);
      if (objMatch) {
        const obj = JSON.parse(objMatch[0]);
        parsed = obj.recommendations || obj.results || Object.values(obj)[0];
      } else {
        return NextResponse.json(
          { error: "Failed to parse recommendations" },
          { status: 500 }
        );
      }
    }

    const recommendations = (parsed as { service: string }[]).map(
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
