"use client";

import { useState } from "react";

type RatingModalProps = {
  title: string;
  label?: string;
  accentFrom?: string;
  accentTo?: string;
  onCancel: () => void;
  onSubmit: (rating: number) => void;
};

export default function RatingModal({
  title,
  label = "Rate this title",
  accentFrom = "from-amber-600",
  accentTo = "to-orange-700",
  onCancel,
  onSubmit,
}: RatingModalProps) {
  const [rating, setRating] = useState(0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-stone-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-1 text-lg font-semibold text-amber-50">{label}</h3>
        <p className="mb-4 text-sm text-stone-400">{title}</p>
        <div className="mb-6 flex justify-center gap-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className="text-3xl touch-manipulation transition-transform active:scale-90"
            >
              {star <= rating ? "★" : "☆"}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-stone-700 py-3 text-sm text-stone-400 touch-manipulation"
          >
            Cancel
          </button>
          <button
            onPointerUp={() => onSubmit(rating)}
            className={`flex-1 rounded-xl bg-gradient-to-r ${accentFrom} ${accentTo} py-3 text-sm font-semibold text-white touch-manipulation`}
          >
            Save & Replace
          </button>
        </div>
      </div>
    </div>
  );
}
