"use client";

import { useState } from "react";
import BackButton from "@/components/BackButton";
import ImageUploader from "@/components/ImageUploader";
import Spinner from "@/components/Spinner";

type ScanResult = {
  identifiedBooks: { title: string; author: string }[];
  recommendations: {
    title: string;
    author: string;
    reason: string;
    alreadyOwned: boolean;
  }[];
};

export default function BookScan() {
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
      const res = await fetch("/api/books/scan", {
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

  return (
    <main className="min-h-screen bg-stone-950 px-4 pb-8 pt-8">
      <div className="mx-auto max-w-md">
        <BackButton />

        <h1 className="mb-2 text-2xl font-bold text-amber-50">
          Bookstore Scanner
        </h1>
        <p className="mb-6 text-sm text-stone-400">
          Snap a photo or record a video panning across a bookshelf to get
          personalized recommendations.
        </p>

        <ImageUploader onImagesReady={handleMediaReady} />

        {images.length > 0 && !loading && !results && (
          <button
            onClick={handleScan}
            className="mt-4 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 text-base font-semibold text-white shadow-lg transition-transform active:scale-95"
          >
            Scan & Recommend
          </button>
        )}

        {loading && (
          <Spinner
            text={
              isVideo
                ? "Analyzing video frames — this may take a moment..."
                : "Scanning bookshelf with AI..."
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
                Books Found ({results.identifiedBooks.length})
              </h2>
              <div className="space-y-2">
                {results.identifiedBooks.map((book, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-stone-900 px-4 py-3 text-sm"
                  >
                    <span className="text-amber-50">{book.title}</span>
                    {book.author && (
                      <span className="text-stone-400">
                        {" "}
                        — {book.author}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-semibold text-amber-50">
                Recommended For You
              </h2>
              <div className="space-y-3">
                {results.recommendations
                  .filter((r) => !r.alreadyOwned)
                  .map((rec, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-emerald-800/50 bg-stone-900 p-4 shadow-md"
                    >
                      <h3 className="font-semibold text-amber-50">
                        {rec.title}
                      </h3>
                      <p className="text-sm text-stone-400">
                        by {rec.author}
                      </p>
                      <p className="mt-2 text-sm text-stone-300">
                        {rec.reason}
                      </p>
                    </div>
                  ))}
                {results.recommendations.some((r) => r.alreadyOwned) && (
                  <p className="text-xs text-stone-500">
                    Some books were hidden because you already own them.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
