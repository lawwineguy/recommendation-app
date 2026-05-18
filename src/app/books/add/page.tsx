"use client";

import { useState, useEffect } from "react";
import BackButton from "@/components/BackButton";
import { getBooks, addBook, migrateFromLocalStorage, type UserBook } from "@/lib/storage";

const genres = [
  { value: "sci-fi", label: "Sci-Fi" },
  { value: "fantasy", label: "Fantasy" },
  { value: "thriller", label: "Thriller" },
  { value: "other", label: "Other" },
];

export default function AddBook() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("other");
  const [rating, setRating] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [myBooks, setMyBooks] = useState<UserBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      await migrateFromLocalStorage();
      setMyBooks(await getBooks());
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    if (!title.trim()) return;

    const book = await addBook({
      title: title.trim(),
      author: author.trim(),
      genre,
      ...(rating ? { rating } : {}),
    });

    setMyBooks((prev) => [...prev, book]);
    setTitle("");
    setAuthor("");
    setGenre("other");
    setRating(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <main className="min-h-screen bg-stone-950 px-4 pb-8 pt-8">
      <div className="mx-auto max-w-md">
        <BackButton />

        <h1 className="mb-2 text-2xl font-bold text-amber-50">Add a Book</h1>
        <p className="mb-6 text-sm text-stone-400">
          Add books to your personal library. These will be included when
          generating recommendations.
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
              placeholder="Enter book title"
              className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-amber-50 placeholder-stone-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-300">
              Author
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter author name"
              className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-amber-50 placeholder-stone-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-stone-300">
              Genre
            </label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="w-full rounded-xl border border-stone-700 bg-stone-900 px-4 py-3 text-amber-50 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
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
            className="w-full rounded-2xl bg-gradient-to-r from-amber-600 to-orange-700 px-6 py-4 text-base font-semibold text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50"
          >
            Save Book
          </button>

          {saved && (
            <div className="rounded-xl bg-emerald-900/30 p-3 text-center text-sm text-emerald-300">
              Book saved!
            </div>
          )}
        </div>

        {!loading && myBooks.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-medium text-stone-300">
              Your Added Books ({myBooks.length})
            </h2>
            <div className="space-y-2">
              {myBooks
                .slice()
                .reverse()
                .map((book, i) => (
                  <div
                    key={book.id || i}
                    className="flex items-center justify-between rounded-xl bg-stone-900 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-amber-50">
                        {book.title}
                      </p>
                      {book.author && (
                        <p className="text-xs text-stone-400">{book.author}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {book.rating && (
                        <span className="text-xs text-amber-500">
                          {"★".repeat(book.rating)}{"☆".repeat(5 - book.rating)}
                        </span>
                      )}
                      <span className="rounded-full bg-stone-800 px-2 py-0.5 text-xs text-stone-400">
                        {book.genre}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
