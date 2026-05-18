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

function requireClient() {
  if (!supabase) throw new Error("Supabase not configured — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return supabase;
}

// --- Books ---

export async function getBooks(): Promise<UserBook[]> {
  const db = requireClient();
  const { data, error } = await db
    .from("user_books")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addBook(book: Omit<UserBook, "id" | "created_at">): Promise<UserBook> {
  const db = requireClient();
  const { data, error } = await db
    .from("user_books")
    .insert(book)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// --- Media ---

export async function getMedia(): Promise<UserMedia[]> {
  const db = requireClient();
  const { data, error } = await db
    .from("user_media")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addMedia(item: Omit<UserMedia, "id" | "created_at">): Promise<UserMedia> {
  const db = requireClient();
  const { data, error } = await db
    .from("user_media")
    .insert(item)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// --- One-time migration from localStorage ---

export async function migrateFromLocalStorage(): Promise<void> {
  if (!supabase) return;
  const migrated = localStorage.getItem("supabase_migrated");
  if (migrated) return;

  try {
    const localBooks = JSON.parse(localStorage.getItem("myBooks") || "[]") as UserBook[];
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

    const localMedia = JSON.parse(localStorage.getItem("myWatchHistory") || "[]") as UserMedia[];
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

    localStorage.removeItem("myBooks");
    localStorage.removeItem("myWatchHistory");
    localStorage.setItem("supabase_migrated", "true");
  } catch (err) {
    console.error("Migration failed:", err);
  }
}
