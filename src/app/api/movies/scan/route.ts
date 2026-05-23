import { NextRequest, NextResponse } from "next/server";
import { getVisionModel, generateWithRetry } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { images, isVideoScan } = await req.json();

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: "No images provided" },
        { status: 400 }
      );
    }

    const maxImages = isVideoScan ? 10 : 5;
    const imageParts = images.slice(0, maxImages).map((img: string) => {
      const base64 = img.replace(/^data:image\/\w+;base64,/, "");
      const mimeType = img.match(/^data:(image\/\w+);/)?.[1] || "image/jpeg";
      return {
        inlineData: { data: base64, mimeType },
      };
    });

    const deduplicationNote = isVideoScan
      ? `\nIMPORTANT: These images are frames extracted from a video panning across a screen. The same title will appear in multiple frames. You MUST deduplicate — list each unique title only once.`
      : "";

    const sourceDescription = isVideoScan
      ? "These are frames from a video of an in-flight entertainment screen."
      : "This is a photo of an in-flight entertainment screen.";

    const prompt = `${sourceDescription}
${deduplicationNote}
1. Identify ALL unique movies and shows visible across the images.
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
    const message =
      err instanceof Error && err.message.includes("too large")
        ? "Video frames too large to process. Try a shorter video or use photo upload."
        : "Failed to scan movies";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
