"use client";

import { useState, useEffect, useRef } from "react";
import BackButton from "@/components/BackButton";
import Spinner from "@/components/Spinner";
import { getBooks, addBook, migrateFromLocalStorage, type UserBook } from "@/lib/storage";

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

export default function BookRecommend() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ratingTarget, setRatingTarget] = useState<number | null>(null);
  const [pendingRating, setPendingRating] = useState<number>(0);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const booksRef = useRef<UserBook[]>([]);

  useEffect(() => {
    (async () => {
      await migrateFromLocalStorage();
      booksRef.current = await getBooks();
    })();
  }, []);

  const refreshBooks = async () => {
    booksRef.current = await getBooks();
  };

  const fetchRecommendations = async (genre: string, count: number, excludeTitles: string[] = []) => {
    const localBooks = booksRef.current;
    const res = await fetch("/api/books/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        genre,
        additionalBooks: localBooks,
        count,
        excludeTitles,
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    const recs = data.recommendations as Recommendation[];
    const ownedSet = new Set(localBooks.map((b) => b.title.toLowerCase()));
    const seen = new Set<string>();
    return recs.filter((r) => {
      const key = r.title.toLowerCase();
      if (ownedSet.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const handleGenreSelect = async (genre: string) => {
    setSelectedGenre(genre);
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const recs = await fetchRecommendations(genre, 3);
      setResults(recs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleAlreadyRead = (index: number) => {
    setRatingTarget(index);
    setPendingRating(0);
  };

  const handleRatingSubmit = async () => {
    if (ratingTarget === null || !results || !selectedGenre) return;

    const targetIndex = ratingTarget;
    const rec = results[targetIndex];

    try {
      await addBook({
        title: rec.title,
        author: rec.author,
        genre: selectedGenre === "surprise" ? "other" : selectedGenre,
        ...(pendingRating > 0 ? { rating: pendingRating } : {}),
      });
      await refreshBooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save rating");
      setRatingTarget(null);
      return;
    }

    setRatingTarget(null);
    setReplacingIndex(targetIndex);

    try {
      const allTitles = [
        ...results.map((r) => r.title),
        ...booksRef.current.map((b) => b.title),
      ];
      const replacements = await fetchRecommendations(selectedGenre, 1, allTitles);
      if (replacements.length > 0) {
        setResults((prev) =>
          prev ? prev.map((r, i) => (i === targetIndex ? replacements[0] : r)) : prev
        );
      }
    } catch {
      setResults((prev) => prev ? prev.filter((_, i) => i !== targetIndex) : prev);
    } finally {
      setReplacingIndex(null);
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
                key={`${rec.title}-${i}`}
                className="rounded-2xl border border-stone-800 bg-stone-900 p-5 shadow-md"
              >
                {replacingIndex === i ? (
                  <div className="flex items-center justify-center py-4">
                    <Spinner text="Finding a replacement..." />
                  </div>
                ) : (
                  <>
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
                    <button
                      onClick={() => handleAlreadyRead(i)}
                      className="mt-3 w-full rounded-xl border border-stone-700 px-3 py-2 text-sm text-stone-400 transition-colors hover:border-amber-600 hover:text-amber-50"
                    >
                      ✓ Already Read It
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {ratingTarget !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
            onClick={() => setRatingTarget(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-stone-900 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-1 text-lg font-semibold text-amber-50">
                Rate this book
              </h3>
              <p className="mb-4 text-sm text-stone-400">
                {results?.[ratingTarget]?.title}
              </p>
              <div className="mb-6 flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setPendingRating(star)}
                    className="text-3xl touch-manipulation transition-transform active:scale-90"
                  >
                    {star <= pendingRating ? "★" : "☆"}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setRatingTarget(null)}
                  className="flex-1 rounded-xl border border-stone-700 py-3 text-sm text-stone-400 touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRatingSubmit}
                  className="flex-1 rounded-xl bg-gradient-to-r from-amber-600 to-orange-700 py-3 text-sm font-semibold text-white touch-manipulation"
                >
                  Save & Replace
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
