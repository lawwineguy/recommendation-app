import { NextRequest, NextResponse } from "next/server";
import { getModel, generateWithRetry } from "@/lib/gemini";
import booksData from "@/data/books.json";

export async function POST(req: NextRequest) {
  try {
    const { genre, additionalBooks, count, excludeTitles } = await req.json();

    let books = booksData as { title: string; author: string; genre: string }[];
    if (genre && genre !== "surprise") {
      books = books.filter((b) => b.genre === genre);
    }

    const extra = (additionalBooks || []) as {
      title: string;
      author: string;
      genre: string;
      rating?: number;
    }[];
    const allBooks = [...books, ...extra];

    const ratedBooks = extra.filter((b) => b.rating);
    let ratingContext = "";
    if (ratedBooks.length > 0) {
      const ratedList = ratedBooks
        .map((b) => `"${b.title}" by ${b.author} — ${b.rating}/5 stars`)
        .join("\n");
      ratingContext = `\n\nHere are my ratings for some books:\n${ratedList}\n\nWeight recommendations toward books similar to my 4-5 star rated books. Avoid recommending things similar to my 1-2 star books.`;
    }

    const bookList = allBooks
      .map((b) => `"${b.title}" by ${b.author} (${b.genre})`)
      .join("\n");

    const genreLabel = genre === "surprise" ? "any genre" : genre;
    const numRecs = count || 3;

    const ownedTitles = allBooks.map((b) => b.title);
    const explicitExcludes = (excludeTitles || []) as string[];
    const allExcluded = [...new Set([...ownedTitles, ...explicitExcludes])];

    const excludeClause = allExcluded.length
      ? `\n\nDo NOT recommend any of these titles (I already own them): ${allExcluded.map((t) => `"${t}"`).join(", ")}`
      : "";

    const prompt = `Based on these books I own and enjoy:

${bookList}${ratingContext}

Recommend exactly ${numRecs} books I DON'T already own that I would love${genre !== "surprise" ? ` in the ${genreLabel} genre` : ""}.
Do not recommend the same title more than once. Each recommendation must be unique.${excludeClause}

For each, respond in this exact JSON format:
[
  {
    "title": "Book Title",
    "author": "Author Name",
    "reason": "One sentence why I'd love it",
    "whereToBuy": "Where to buy it (e.g., Amazon, local bookstore, etc.)"
  }
]

Return ONLY the JSON array, no other text.`;

    const model = getModel();
    const text = await generateWithRetry(model, prompt);

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse recommendations" },
        { status: 500 }
      );
    }

    const recommendations = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ recommendations });
  } catch (err) {
    console.error("Book recommend error:", err);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 }
    );
  }
}
