"use client";

import { useState, useEffect } from "react";
import BackButton from "@/components/BackButton";

type WatchHistoryItem = {
  title: string;
  type: string;
  genre: string;
  rating?: number;
};

const genres = [
  { value: "action-thriller", label: "Action / Thriller" },
  { value: "sci-fi", label: "Sci-Fi" },
  { value: "comedy", label: "Comedy" },
  { value: "drama", label: "Drama" },
  { value: "horror", label: "Horror" },
  { value: "documentary", label: "Documentary" },
  { value: "other", label: "Other" },
];

function getWatchHistory(): WatchHistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem("myWatchHistory") || "[]");
  } catch {
    return [];
  }
}

function saveWatchHistory(items: WatchHistoryItem[]) {
  localStorage.setItem("myWatchHistory", JSON.stringify(items));
}

export default function AddMovie() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"movie" | "tv">("movie");
  const [genre, setGenre] = useState("other");
  const [rating, setRating] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);

  useEffect(() => {
    setHistory(getWatchHistory());
  }, []);

  const handleSave = () => {
    if (!title.trim()) return;

    const item: WatchHistoryItem = {
      title: title.trim(),
      type,
      genre,
      ...(rating ? { rating } : {}),
    };

    const updated = [...history, item];
    saveWatchHistory(updated);
    setHistory(updated);
    setTitle("");
    setType("movie");
    setGenre("other");
    setRating(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <main className="min-h-screen bg-stone-950 px-4 pb-8 pt-8">
      <div className="mx-auto max-w-md">
        <BackButton />

        <h1 className="mb-2 text-2xl font-bold text-amber-50">
          Add to Watch History
        </h1>
        <p className="mb-6 text-sm text-stone-400">
          Log movies and shows you&apos;ve watched. These improve your
          recommendations.
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-300">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
              className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-amber-50 placeholder-stone-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-stone-300">
              Type
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setType("movie")}
                className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                  type === "movie"
                    ? "border-violet-500 bg-violet-500/10 text-violet-300"
                    : "border-stone-700 bg-stone-900 text-stone-400"
                }`}
              >
                🎬 Movie
              </button>
              <button
                onClick={() => setType("tv")}
                className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                  type === "tv"
                    ? "border-violet-500 bg-violet-500/10 text-violet-300"
                    : "border-stone-700 bg-stone-900 text-stone-400"
                }`}
              >
                📺 TV Show
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-300">
              Genre
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-amber-50 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              {genres.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-stone-300">
              Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(rating === star ? null : star)}
                  className="text-2xl transition-transform active:scale-90"
                >
                  {rating && star <= rating ? "★" : "☆"}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 px-6 py-4 text-base font-semibold text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50"
          >
            Save to Watch History
          </button>

          {saved && (
            <div className="rounded-xl bg-emerald-900/30 p-3 text-center text-sm text-emerald-300">
              Saved!
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-medium text-stone-300">
              Watch History ({history.length})
            </h2>
            <div className="space-y-2">
              {history
                .slice()
                .reverse()
                .map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl bg-stone-900 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-amber-50">
                        {item.title}
                      </p>
                      <p className="text-xs text-stone-400">
                        {item.type === "tv" ? "TV Show" : "Movie"} · {item.genre}
                        {item.rating ? ` · ${"★".repeat(item.rating)}${"☆".repeat(5 - item.rating)}` : ""}
                      </p>
                    </div>
                    <span className="text-lg">
                      {item.type === "tv" ? "📺" : "🎬"}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
