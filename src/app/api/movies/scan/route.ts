import { NextRequest, NextResponse } from "next/server";
import { getVisionModel, generateWithRetry } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { images } = await req.json();

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: "No images provided" },
        { status: 400 }
      );
    }

    const imageParts = images.slice(0, 5).map((img: string) => {
      const base64 = img.replace(/^data:image\/\w+;base64,/, "");
      const mimeType = img.match(/^data:(image\/\w+);/)?.[1] || "image/jpeg";
      return {
        inlineData: { data: base64, mimeType },
      };
    });

    const prompt = `This is a photo of an in-flight entertainment screen.

1. Identify ALL movies and shows visible on the screen.
2. Based on general popularity and critical acclaim, rank the top 3 movies/shows I should watch on this flight.

Respond in this exact JSON format:
{
  "allTitles": [
    {"title": "Title", "type": "movie or tv"}
  ],
  "topPicks": [
    {
      "rank": 1,
      "title": "Title",
      "type": "movie or tv",
      "reason": "Why I should watch this on the flight"
    }
  ]
}

Return ONLY the JSON, no other text.`;

    const model = getVisionModel();
    const text = await generateWithRetry(model, [prompt, ...imageParts]);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse scan results" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Movie scan error:", err);
    return NextResponse.json(
      { error: "Failed to scan movies" },
      { status: 500 }
    );
  }
}
