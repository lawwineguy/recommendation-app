"use client";

import { useState, useRef, useCallback } from "react";

type Props = {
  onImagesReady: (images: string[]) => void;
  maxFrames?: number;
};

export default function ImageUploader({ onImagesReady, maxFrames = 5 }: Props) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const extractFrames = useCallback(
    (videoFile: File): Promise<string[]> => {
      return new Promise((resolve) => {
        const video = document.createElement("video");
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        const frames: string[] = [];

        video.preload = "metadata";
        video.muted = true;
        video.playsInline = true;

        video.onloadedmetadata = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const interval = 2;
          const maxTime = video.duration;
          let currentTime = 0;

          const captureFrame = () => {
            if (currentTime > maxTime || frames.length >= maxFrames) {
              resolve(frames);
              URL.revokeObjectURL(video.src);
              return;
            }
            video.currentTime = currentTime;
          };

          video.onseeked = () => {
            ctx.drawImage(video, 0, 0);
            frames.push(canvas.toDataURL("image/jpeg", 0.8));
            currentTime += interval;
            captureFrame();
          };

          captureFrame();
        };

        video.src = URL.createObjectURL(videoFile);
      });
    },
    [maxFrames]
  );

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setProcessing(true);
    const allImages: string[] = [];

    for (const file of Array.from(files)) {
      if (file.type.startsWith("video/")) {
        const frames = await extractFrames(file);
        allImages.push(...frames);
      } else if (file.type.startsWith("image/")) {
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        allImages.push(dataUrl);
      }
    }

    const limited = allImages.slice(0, maxFrames);
    setPreviews(limited);
    setProcessing(false);
    onImagesReady(limited);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex-1 rounded-2xl border-2 border-dashed border-stone-600 bg-stone-800/50 px-4 py-6 text-center transition-colors hover:border-amber-500 hover:bg-stone-800"
        >
          <svg className="mx-auto mb-2 h-8 w-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
          </svg>
          <span className="text-sm text-stone-400">
            Take Photo or Upload
          </span>
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        multiple
        onChange={handleFile}
        className="hidden"
      />

      {processing && (
        <div className="flex items-center justify-center gap-2 py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-200 border-t-amber-600" />
          <span className="text-sm text-stone-400">Processing...</span>
        </div>
      )}

      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative aspect-[3/4] overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Preview ${i + 1}`}
                className="h-full w-full object-cover"
              />
              <span className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                {i + 1}/{previews.length}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
