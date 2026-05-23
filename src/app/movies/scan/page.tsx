"use client";

import { useState } from "react";
import BackButton from "@/components/BackButton";
import ImageUploader from "@/components/ImageUploader";
import Spinner from "@/components/Spinner";

type ScanResult = {
  allTitles: { title: string; type: string }[];
  topPicks: {
    rank: number;
    title: string;
    type: string;
    reason: string;
  }[];
};

export default function MovieScan() {
  const [images, setImages] = useState<string[]>([]);
  const [isVideo, setIsVideo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMediaReady = (imgs: string[], video?: boolean) => {
    setImages(imgs);
    setIsVideo(!!video);
    setResults(null);
    setError(null);
  };

  const handleScan = async () => {
    if (images.length === 0) return;
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch("/api/movies/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images, isVideoScan: isVideo }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const rankColors = ["text-amber-400", "text-stone-300", "text-orange-400"];

  return (
    <main className="min-h-screen bg-stone-950 px-4 pb-8 pt-8">
      <div className="mx-auto max-w-md">
        <BackButton />

        <h1 className="mb-2 text-2xl font-bold text-amber-50">
          Plane Movie Scanner
        </h1>
        <p className="mb-6 text-sm text-stone-400">
          Snap a photo or record a video of the seatback screen to find the best
          picks for your flight.
        </p>

        <ImageUploader onImagesReady={handleMediaReady} />

        {images.length > 0 && !loading && !results && (
          <button
            onClick={handleScan}
            className="mt-4 w-full rounded-2xl bg-gradient-to-r from-sky-600 to-blue-700 px-6 py-4 text-base font-semibold text-white shadow-lg transition-transform active:scale-95"
          >
            Scan & Rank
          </button>
        )}

        {loading && (
          <Spinner
            text={
              isVideo
                ? "Analyzing video frames — this may take a moment..."
                : "Scanning entertainment screen..."
            }
          />
        )}

        {error && (
          <div className="mt-4 rounded-xl bg-red-900/30 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {results && (
          <div className="mt-6 space-y-6">
            <div>
              <h2 className="mb-3 text-lg font-semibold text-amber-50">
                Top Picks For Your Flight
              </h2>
              <div className="space-y-3">
                {results.topPicks.map((pick, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-sky-800/50 bg-stone-900 p-5 shadow-md"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={`text-2xl font-bold ${rankColors[i] || "text-stone-400"}`}
                      >
                        #{pick.rank}
                      </span>
                      <span className="rounded-full bg-stone-800 px-2 py-0.5 text-xs text-stone-400">
                        {pick.type}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-amber-50">
                      {pick.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-stone-300">
                      {pick.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-sm font-medium text-stone-400">
                All titles found ({results.allTitles.length})
              </h2>
              <div className="flex flex-wrap gap-2">
                {results.allTitles.map((t, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-stone-800 px-3 py-1.5 text-xs text-stone-300"
                  >
                    {t.title}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
