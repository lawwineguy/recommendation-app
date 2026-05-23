"use client";

import { useState, useRef, useCallback } from "react";

const MAX_VIDEO_SIZE_MB = 50;
const MAX_VIDEO_DURATION_S = 30;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;
const MAX_VIDEO_FRAMES = 10;

type Props = {
  onImagesReady: (images: string[], isVideo?: boolean) => void;
  maxFrames?: number;
};

export default function ImageUploader({ onImagesReady, maxFrames = 5 }: Props) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        resolve(video.duration);
        URL.revokeObjectURL(video.src);
      };
      video.onerror = () => reject(new Error("Could not read video file"));
      video.src = URL.createObjectURL(file);
    });
  };

  const extractFrames = useCallback(
    (videoFile: File): Promise<string[]> => {
      return new Promise((resolve) => {
        const video = document.createElement("video");
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        const frames: string[] = [];
        const frameLimit = MAX_VIDEO_FRAMES;

        video.preload = "metadata";
        video.muted = true;
        video.playsInline = true;

        video.onloadedmetadata = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const interval = Math.max(1, video.duration / frameLimit);
          const maxTime = video.duration;
          let currentTime = 0;

          const captureFrame = () => {
            if (currentTime > maxTime || frames.length >= frameLimit) {
              resolve(frames);
              URL.revokeObjectURL(video.src);
              return;
            }
            video.currentTime = currentTime;
          };

          video.onseeked = () => {
            ctx.drawImage(video, 0, 0);
            frames.push(canvas.toDataURL("image/jpeg", 0.8));
            setProgressText(
              `Extracting frame ${frames.length} of ~${Math.min(frameLimit, Math.ceil(maxTime / interval))}...`
            );
            currentTime += interval;
            captureFrame();
          };

          captureFrame();
        };

        video.src = URL.createObjectURL(videoFile);
      });
    },
    []
  );

  const resetState = () => {
    setPreviews([]);
    setValidationError(null);
    setProgressText("");
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    resetState();
    setProcessing(true);
    setProgressText("Processing photo...");

    const allImages: string[] = [];
    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/")) {
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
    setProgressText("");
    onImagesReady(limited, false);

    if (photoRef.current) photoRef.current.value = "";
  };

  const handleVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    resetState();

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      setValidationError(
        `Video must be under ${MAX_VIDEO_SIZE_MB}MB. Yours is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`
      );
      if (videoRef.current) videoRef.current.value = "";
      return;
    }

    try {
      const duration = await getVideoDuration(file);
      if (duration > MAX_VIDEO_DURATION_S) {
        setValidationError(
          `Video must be ${MAX_VIDEO_DURATION_S}s or shorter. Yours is ${Math.ceil(duration)}s.`
        );
        if (videoRef.current) videoRef.current.value = "";
        return;
      }
    } catch {
      setValidationError(
        "Could not read video file. Try a different format (mp4, mov, or webm)."
      );
      if (videoRef.current) videoRef.current.value = "";
      return;
    }

    setProcessing(true);
    setProgressText("Extracting frames from video...");

    try {
      const frames = await extractFrames(file);
      if (frames.length === 0) {
        setValidationError(
          "Could not extract frames from video. Try a shorter video or use photo upload."
        );
        setProcessing(false);
        setProgressText("");
        return;
      }
      setPreviews(frames);
      setProcessing(false);
      setProgressText("");
      onImagesReady(frames, true);
    } catch {
      setValidationError(
        "Failed to process video. Try a shorter video or use photo upload instead."
      );
      setProcessing(false);
      setProgressText("");
    }

    if (videoRef.current) videoRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => photoRef.current?.click()}
          disabled={processing}
          className="rounded-2xl border-2 border-dashed border-stone-600 bg-stone-800/50 px-4 py-6 text-center transition-colors hover:border-amber-500 hover:bg-stone-800 disabled:opacity-50"
        >
          <svg
            className="mx-auto mb-2 h-8 w-8 text-stone-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
            />
          </svg>
          <span className="text-sm text-stone-400">Photo</span>
        </button>
        <button
          onClick={() => videoRef.current?.click()}
          disabled={processing}
          className="rounded-2xl border-2 border-dashed border-stone-600 bg-stone-800/50 px-4 py-6 text-center transition-colors hover:border-violet-500 hover:bg-stone-800 disabled:opacity-50"
        >
          <svg
            className="mx-auto mb-2 h-8 w-8 text-stone-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
          <span className="text-sm text-stone-400">Video</span>
          <span className="mt-1 block text-xs text-stone-500">
            {MAX_VIDEO_DURATION_S}s max
          </span>
        </button>
      </div>

      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handlePhoto}
        className="hidden"
      />
      <input
        ref={videoRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        onChange={handleVideo}
        className="hidden"
      />

      {validationError && (
        <div className="rounded-xl bg-red-900/30 p-4 text-sm text-red-300">
          {validationError}
        </div>
      )}

      {processing && (
        <div className="flex items-center justify-center gap-2 py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-200 border-t-amber-600" />
          <span className="text-sm text-stone-400">{progressText}</span>
        </div>
      )}

      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {previews.map((src, i) => (
            <div
              key={i}
              className="relative aspect-[3/4] overflow-hidden rounded-xl"
            >
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
