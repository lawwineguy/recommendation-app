import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = supabaseUrl
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export type Book = {
  title: string;
  author: string;
  genre: "sci-fi" | "fantasy" | "thriller" | "other";
};

export type StreamingService = {
  id: number;
  service_name: string;
  is_active: boolean;
};
