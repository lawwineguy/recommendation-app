"use client";

export default function Spinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
      <p className="text-sm text-stone-400">{text}</p>
    </div>
  );
}
