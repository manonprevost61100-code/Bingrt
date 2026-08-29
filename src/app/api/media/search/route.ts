import { NextRequest, NextResponse } from "next/server";
import { searchMedia } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query || query.trim().length === 0) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchMedia(query);
    return NextResponse.json({ results });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erreur lors de la recherche TMDB" },
      { status: 502 }
    );
  }
}
