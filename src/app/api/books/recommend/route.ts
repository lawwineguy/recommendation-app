import { NextRequest, NextResponse } from "next/server";
import { getModel } from "@/lib/gemini";
import booksData from "@/data/books.json";

export async function POST(req: NextRequest) {
  try {
    const { genre, additionalBooks } = await req.json();

    let books = booksData as { title: string; author: string; genre: string }[];
    if (genre && genre !== "surprise") {
      books = books.filter((b) => b.genre === genre);
    }

    const extra = (additionalBooks || []) as {
      title: string;
      author: string;
      genre: string;
    }[];
    const allBooks = [...books, ...extra];

    const bookList = allBooks
      .map((b) => `"${b.title}" by ${b.author} (${b.genre})`)
      .join("\n");

    const genreLabel = genre === "surprise" ? "any genre" : genre;

    const prompt = `Based on these books I own and enjoy:

${bookList}

Recommend exactly 3 books I DON'T already own that I would love${genre !== "surprise" ? ` in the ${genreLabel} genre` : ""}.

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
    const result = await model.generateContent(prompt);
    const text = result.response.text();

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
