"use client";

import { useState, useEffect } from "react";
import BackButton from "@/components/BackButton";
import Spinner from "@/components/Spinner";

type StreamingService = {
  id: number;
  service_name: string;
  is_active: boolean;
};

type Recommendation = {
  title: string;
  service: string;
  serviceBadge: string;
  pitch: string;
  genre: string;
};

type WatchHistoryItem = {
  title: string;
  type: string;
  genre: string;
  rating?: number;
};

const moods = [
  { value: "action-thriller", label: "Action / Thriller", emoji: "💥" },
  { value: "sci-fi", label: "Sci-Fi", emoji: "🛸" },
  { value: "comedy", label: "Comedy", emoji: "😂" },
  { value: "drama", label: "Drama", emoji: "🎭" },
  { value: "horror", label: "Horror", emoji: "👻" },
  { value: "anything", label: "Anything", emoji: "🎲" },
];

function getWatchHistory(): WatchHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("myWatchHistory") || "[]");
  } catch {
    return [];
  }
}

function saveWatchHistory(items: WatchHistoryItem[]) {
  localStorage.setItem("myWatchHistory", JSON.stringify(items));
}

export default function MovieRecommend() {
  const [services, setServices] = useState<StreamingService[]>([]);
  const [activeServices, setActiveServices] = useState<string[]>([]);
  const [step, setStep] = useState<"services" | "type" | "mood" | "results">("services");
  const [type, setType] = useState<"movie" | "tv" | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ratingTarget, setRatingTarget] = useState<number | null>(null);
  const [pendingRating, setPendingRating] = useState<number>(0);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/movies/services")
      .then((res) => res.json())
      .then(({ services: data }) => {
        if (data) {
          setServices(data);
          setActiveServices(data.map((s: StreamingService) => s.service_name));
        }
      });
  }, []);

  const fetchRecommendations = async (
    selectedType: string,
    selectedMood: string,
    count: number,
    excludeTitles: string[] = []
  ) => {
    const watchHistory = getWatchHistory();
    const res = await fetch("/api/movies/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: selectedType,
        mood: selectedMood,
        services: activeServices,
        watchHistory,
        count,
        excludeTitles,
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.recommendations as Recommendation[];
  };

  const handleGetRecs = async (selectedMood: string) => {
    setMood(selectedMood);
    setStep("results");
    setLoading(true);
    setError(null);

    try {
      const recs = await fetchRecommendations(type!, selectedMood, 5);
      setResults(recs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleAlreadySeen = (index: number) => {
    setRatingTarget(index);
    setPendingRating(0);
  };

  const handleRatingSubmit = async () => {
    if (ratingTarget === null || !results || !type || !mood) return;

    const rec = results[ratingTarget];
    const history = getWatchHistory();

    const newItem: WatchHistoryItem = {
      title: rec.title,
      type,
      genre: rec.genre,
      ...(pendingRating > 0 ? { rating: pendingRating } : {}),
    };
    const updated = [...history, newItem];
    saveWatchHistory(updated);

    setRatingTarget(null);
    setReplacingIndex(ratingTarget);

    try {
      const allTitles = [
        ...results.map((r) => r.title),
        ...updated.map((h) => h.title),
      ];
      const replacements = await fetchRecommendations(type, mood, 1, allTitles);
      if (replacements.length > 0) {
        setResults((prev) =>
          prev ? prev.map((r, i) => (i === ratingTarget ? replacements[0] : r)) : prev
        );
      }
    } catch {
      setResults((prev) => prev ? prev.filter((_, i) => i !== ratingTarget) : prev);
    } finally {
      setReplacingIndex(null);
    }
  };

  return (
    <main className="min-h-screen bg-stone-950 px-4 pb-8 pt-8">
      <div className="mx-auto max-w-md">
        <BackButton />

        <h1 className="mb-2 text-2xl font-bold text-amber-50">
          What Should I Watch?
        </h1>
        <p className="mb-6 text-sm text-stone-400">
          Get recommendations from your streaming services.
        </p>

        {step === "services" && (
          <div>
            <h2 className="mb-3 text-sm font-medium text-stone-300">
              Your Streaming Services
            </h2>
            <div className="mb-6 space-y-2">
              {services.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl bg-stone-900 px-4 py-3"
                >
                  <input
                    type="checkbox"
                    checked={activeServices.includes(s.service_name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setActiveServices([...activeServices, s.service_name]);
                      } else {
                        setActiveServices(
                          activeServices.filter((n) => n !== s.service_name)
                        );
                      }
                    }}
                    className="h-5 w-5 rounded border-stone-600 bg-stone-800 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-amber-50">{s.service_name}</span>
                </label>
              ))}
            </div>
            <button
              onClick={() => setStep("type")}
              disabled={activeServices.length === 0}
              className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 px-6 py-4 text-base font-semibold text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}

        {step === "type" && (
          <div>
            <h2 className="mb-4 text-sm font-medium text-stone-300">
              What are you in the mood for?
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setType("movie");
                  setStep("mood");
                }}
                className="rounded-2xl border-2 border-stone-700 bg-stone-900 px-4 py-6 text-center transition-all hover:border-violet-500 active:scale-95"
              >
                <span className="block text-3xl">🎬</span>
                <span className="mt-2 block font-medium text-amber-50">
                  Movie
                </span>
              </button>
              <button
                onClick={() => {
                  setType("tv");
                  setStep("mood");
                }}
                className="rounded-2xl border-2 border-stone-700 bg-stone-900 px-4 py-6 text-center transition-all hover:border-violet-500 active:scale-95"
              >
                <span className="block text-3xl">📺</span>
                <span className="mt-2 block font-medium text-amber-50">
                  TV Show
                </span>
              </button>
            </div>
          </div>
        )}

        {step === "mood" && (
          <div>
            <h2 className="mb-4 text-sm font-medium text-stone-300">
              What mood?
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {moods.map((m) => (
                <button
                  key={m.value}
                  onClick={() => handleGetRecs(m.value)}
                  className="rounded-2xl border-2 border-stone-700 bg-stone-900 px-4 py-5 text-center transition-all hover:border-violet-500 active:scale-95"
                >
                  <span className="block text-2xl">{m.emoji}</span>
                  <span className="mt-1 block text-sm font-medium text-amber-50">
                    {m.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "results" && (
          <div>
            {loading && <Spinner text="Finding the perfect watch..." />}

            {error && (
              <div className="rounded-xl bg-red-900/30 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            {results && (
              <div className="space-y-4">
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
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-medium uppercase tracking-wider text-violet-400">
                            #{i + 1}
                          </span>
                          <span className="rounded-full bg-stone-800 px-3 py-1 text-xs text-stone-300">
                            {rec.serviceBadge}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-amber-50">
                          {rec.title}
                        </h3>
                        <span className="text-xs text-stone-500">{rec.genre}</span>
                        <p className="mt-2 text-sm leading-relaxed text-stone-300">
                          {rec.pitch}
                        </p>
                        <button
                          onClick={() => handleAlreadySeen(i)}
                          className="mt-3 w-full rounded-xl border border-stone-700 px-3 py-2 text-sm text-stone-400 transition-colors hover:border-violet-500 hover:text-violet-300"
                        >
                          ✓ Already Seen It
                        </button>
                      </>
                    )}
                  </div>
                ))}

                <button
                  onClick={() => {
                    setStep("mood");
                    setResults(null);
                  }}
                  className="w-full rounded-2xl border border-stone-700 px-4 py-3 text-sm text-stone-400 transition-colors hover:border-stone-500 hover:text-stone-300"
                >
                  Try a different mood
                </button>
              </div>
            )}
          </div>
        )}

        {ratingTarget !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-sm rounded-2xl bg-stone-900 p-6 shadow-2xl">
              <h3 className="mb-1 text-lg font-semibold text-amber-50">
                Rate this title
              </h3>
              <p className="mb-4 text-sm text-stone-400">
                {results?.[ratingTarget]?.title}
              </p>
              <div className="mb-6 flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setPendingRating(star)}
                    className="text-3xl transition-transform active:scale-90"
                  >
                    {star <= pendingRating ? "★" : "☆"}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setRatingTarget(null)}
                  className="flex-1 rounded-xl border border-stone-700 py-3 text-sm text-stone-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRatingSubmit}
                  className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 py-3 text-sm font-semibold text-white"
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
