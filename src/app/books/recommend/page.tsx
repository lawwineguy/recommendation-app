"use client";

import { useState } from "react";
import BackButton from "@/components/BackButton";
import Spinner from "@/components/Spinner";

type Recommendation = {
  title: string;
  author: string;
  reason: string;
  whereToBuy: string;
};

const genres = [
  { value: "sci-fi", label: "Sci-Fi", emoji: "🚀" },
  { value: "fantasy", label: "Fantasy", emoji: "🐉" },
  { value: "thriller", label: "Thriller", emoji: "🔪" },
  { value: "surprise", label: "Surprise Me", emoji: "🎲" },
];

function getLocalBooks() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("myBooks") || "[]");
  } catch {
    return [];
  }
}

export default function BookRecommend() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenreSelect = async (genre: string) => {
    setSelectedGenre(genre);
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch("/api/books/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genre, additionalBooks: getLocalBooks() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-950 px-4 pb-8 pt-8">
      <div className="mx-auto max-w-md">
        <BackButton />

        <h1 className="mb-2 text-2xl font-bold text-amber-50">
          Recommend a Book
        </h1>
        <p className="mb-6 text-sm text-stone-400">
          Pick a genre and get AI recommendations based on your library of 500+ books.
        </p>

        <div className="mb-8 grid grid-cols-2 gap-3">
          {genres.map((g) => (
            <button
              key={g.value}
              onClick={() => handleGenreSelect(g.value)}
              disabled={loading}
              className={`rounded-2xl border-2 px-4 py-5 text-center transition-all active:scale-95 ${
                selectedGenre === g.value
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-stone-700 bg-stone-900 hover:border-stone-500"
              } ${loading ? "opacity-50" : ""}`}
            >
              <span className="block text-2xl">{g.emoji}</span>
              <span className="mt-1 block text-sm font-medium text-amber-50">
                {g.label}
              </span>
            </button>
          ))}
        </div>

        {loading && <Spinner text="Analyzing your library..." />}

        {error && (
          <div className="rounded-xl bg-red-900/30 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {results && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-amber-50">
              Your Recommendations
            </h2>
            {results.map((rec, i) => (
              <div
                key={i}
                className="rounded-2xl border border-stone-800 bg-stone-900 p-5 shadow-md"
              >
                <div className="mb-1 text-xs font-medium uppercase tracking-wider text-amber-500">
                  Pick #{i + 1}
                </div>
                <h3 className="text-lg font-semibold text-amber-50">
                  {rec.title}
                </h3>
                <p className="text-sm text-stone-400">by {rec.author}</p>
                <p className="mt-3 text-sm leading-relaxed text-stone-300">
                  {rec.reason}
                </p>
                <div className="mt-3 rounded-lg bg-stone-800 px-3 py-2 text-xs text-stone-400">
                  📍 {rec.whereToBuy}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
