import { supabase } from "./supabase";

export type UserBook = {
  id?: number;
  title: string;
  author: string;
  genre: string;
  rating?: number;
  created_at?: string;
};

export type UserMedia = {
  id?: number;
  title: string;
  type: string;
  genre: string;
  rating?: number;
  created_at?: string;
};

const BOOKS_KEY = "myBooks";
const MEDIA_KEY = "myWatchHistory";

function loadLocal<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as T[];
  } catch {
    return [];
  }
}

function saveLocal<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

// --- Books ---

export async function getBooks(): Promise<UserBook[]> {
  if (!supabase) return loadLocal<UserBook>(BOOKS_KEY);
  const { data, error } = await supabase
    .from("user_books")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addBook(book: Omit<UserBook, "id" | "created_at">): Promise<UserBook> {
  if (!supabase) {
    const books = loadLocal<UserBook>(BOOKS_KEY);
    const existing = books.findIndex(
      (b) => b.title.toLowerCase() === book.title.toLowerCase()
    );
    if (existing >= 0) {
      books[existing] = { ...books[existing], ...book };
      saveLocal(BOOKS_KEY, books);
      return books[existing];
    }
    const newBook: UserBook = { ...book, id: Date.now(), created_at: new Date().toISOString() };
    books.push(newBook);
    saveLocal(BOOKS_KEY, books);
    return newBook;
  }
  const { data, error } = await supabase
    .from("user_books")
    .upsert(book, { onConflict: "title" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBookRating(title: string, rating: number): Promise<void> {
  if (!supabase) {
    const books = loadLocal<UserBook>(BOOKS_KEY);
    const index = books.findIndex(
      (b) => b.title.toLowerCase() === title.toLowerCase()
    );
    if (index < 0) throw new Error("Book not found");
    books[index].rating = rating;
    saveLocal(BOOKS_KEY, books);
    return;
  }
  const { error } = await supabase
    .from("user_books")
    .update({ rating })
    .ilike("title", title);
  if (error) throw error;
}

// --- Media ---

export async function getMedia(): Promise<UserMedia[]> {
  if (!supabase) return loadLocal<UserMedia>(MEDIA_KEY);
  const { data, error } = await supabase
    .from("user_media")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addMedia(item: Omit<UserMedia, "id" | "created_at">): Promise<UserMedia> {
  if (!supabase) {
    const media = loadLocal<UserMedia>(MEDIA_KEY);
    const existing = media.findIndex(
      (m) => m.title.toLowerCase() === item.title.toLowerCase()
    );
    if (existing >= 0) {
      media[existing] = { ...media[existing], ...item };
      saveLocal(MEDIA_KEY, media);
      return media[existing];
    }
    const newItem: UserMedia = { ...item, id: Date.now(), created_at: new Date().toISOString() };
    media.push(newItem);
    saveLocal(MEDIA_KEY, media);
    return newItem;
  }
  const { data, error } = await supabase
    .from("user_media")
    .upsert(item, { onConflict: "title" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMediaRating(title: string, rating: number): Promise<void> {
  if (!supabase) {
    const media = loadLocal<UserMedia>(MEDIA_KEY);
    const index = media.findIndex(
      (m) => m.title.toLowerCase() === title.toLowerCase()
    );
    if (index < 0) throw new Error("Title not found");
    media[index].rating = rating;
    saveLocal(MEDIA_KEY, media);
    return;
  }
  const { error } = await supabase
    .from("user_media")
    .update({ rating })
    .ilike("title", title);
  if (error) throw error;
}

// --- One-time migration from localStorage ---

export async function migrateFromLocalStorage(): Promise<void> {
  if (!supabase) return;
  const migrated = localStorage.getItem("supabase_migrated");
  if (migrated) return;

  try {
    const localBooks = loadLocal<UserBook>(BOOKS_KEY);
    if (localBooks.length > 0) {
      const rows = localBooks.map((b) => ({
        title: b.title,
        author: b.author,
        genre: b.genre,
        ...(b.rating ? { rating: b.rating } : {}),
      }));
      const { error } = await supabase.from("user_books").insert(rows);
      if (error) throw error;
    }

    const localMedia = loadLocal<UserMedia>(MEDIA_KEY);
    if (localMedia.length > 0) {
      const rows = localMedia.map((m) => ({
        title: m.title,
        type: m.type,
        genre: m.genre,
        ...(m.rating ? { rating: m.rating } : {}),
      }));
      const { error } = await supabase.from("user_media").insert(rows);
      if (error) throw error;
    }

    localStorage.removeItem(BOOKS_KEY);
    localStorage.removeItem(MEDIA_KEY);
    localStorage.setItem("supabase_migrated", "true");
  } catch (err) {
    console.error("Migration failed:", err);
  }
}
