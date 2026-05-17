import { NextRequest, NextResponse } from "next/server";
import { getVisionModel } from "@/lib/gemini";
import booksData from "@/data/books.json";

export async function POST(req: NextRequest) {
  try {
    const { images, additionalBooks } = await req.json();

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: "No images provided" },
        { status: 400 }
      );
    }

    const books = booksData as { title: string; author: string; genre: string }[];
    const extra = (additionalBooks || []) as {
      title: string;
      author: string;
      genre: string;
    }[];
    const allBooks = [...books, ...extra];

    const genreCounts: Record<string, number> = {};
    const authorCounts: Record<string, number> = {};
    allBooks.forEach((b) => {
      genreCounts[b.genre] = (genreCounts[b.genre] || 0) + 1;
      authorCounts[b.author] = (authorCounts[b.author] || 0) + 1;
    });

    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([g]) => g)
      .join(", ");
    const topAuthors = Object.entries(authorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([a]) => a)
      .join(", ");

    const ownedTitles = allBooks.map((b) => b.title.toLowerCase());

    const imageParts = images.slice(0, 5).map((img: string) => {
      const base64 = img.replace(/^data:image\/\w+;base64,/, "");
      const mimeType = img.match(/^data:(image\/\w+);/)?.[1] || "image/jpeg";
      return {
        inlineData: { data: base64, mimeType },
      };
    });

    const prompt = `These are photos of books on a shelf at a bookstore.

1. Identify ALL book titles and authors you can see in these images. List every one.
2. My reading profile: I enjoy genres like ${topGenres}. My favorite authors include ${topAuthors}. I own ${allBooks.length} books.
3. From the books you identified, recommend which ones I should buy and why, based on my reading profile.

Respond in this exact JSON format:
{
  "identifiedBooks": [
    {"title": "Book Title", "author": "Author Name (if visible)"}
  ],
  "recommendations": [
    {
      "title": "Book Title",
      "author": "Author Name",
      "reason": "One sentence why I should buy it based on my reading preferences",
      "alreadyOwned": false
    }
  ]
}

Mark "alreadyOwned": true for any book I likely already own based on my library.
Return ONLY the JSON, no other text.`;

    const model = getVisionModel();
    const result = await model.generateContent([prompt, ...imageParts]);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse scan results" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    parsed.recommendations = (parsed.recommendations || []).map(
      (r: { title: string; alreadyOwned?: boolean }) => ({
        ...r,
        alreadyOwned:
          r.alreadyOwned ||
          ownedTitles.includes(r.title.toLowerCase()),
      })
    );

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Book scan error:", err);
    return NextResponse.json(
      { error: "Failed to scan books" },
      { status: 500 }
    );
  }
}
