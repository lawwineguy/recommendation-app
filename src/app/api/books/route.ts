import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const { data, error } = await supabase
    .from("user_books")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ books: data });
}

export async function POST(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const body = await req.json();
  const books = Array.isArray(body) ? body : [body];

  const { data, error } = await supabase
    .from("user_books")
    .upsert(books, { onConflict: "title" })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ books: data });
}

export async function PATCH(req: NextRequest) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const { title, rating } = await req.json();

  if (!title || typeof rating !== "number") {
    return NextResponse.json(
      { error: "title (string) and rating (number) are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("user_books")
    .update({ rating })
    .ilike("title", title)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ book: data });
}
