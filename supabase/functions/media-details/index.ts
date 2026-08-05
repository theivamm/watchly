import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const TMDB_TOKEN = Deno.env.get("TMDB_API_READ_TOKEN");
const TMDB_BASE = "https://api.themoviedb.org/3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const id = url.searchParams.get("id");

    if (!type || !id || (type !== "movie" && type !== "tv")) {
      return new Response(
        JSON.stringify({ error: "Invalid type or id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const endpoint = type === "movie" ? `/movie/${id}` : `/tv/${id}`;
    const params = new URLSearchParams({ language: "es-AR" });

    const response = await fetch(`${TMDB_BASE}${endpoint}?${params}`, {
      headers: {
        Authorization: `Bearer ${TMDB_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    const result = {
      tmdbId: data.id,
      mediaType: type,
      title: data.title || data.name || "",
      originalTitle: data.original_title || data.original_name || "",
      overview: data.overview || "",
      year: ((data.release_date || data.first_air_date) || "").substring(0, 4) || null,
      releaseDate: data.release_date || data.first_air_date || null,
      posterPath: data.poster_path,
      backdropPath: data.backdrop_path,
      genreIds: (data.genres || []).map((g: { id: number }) => g.id),
      tmdbRating: data.vote_average || null,
      runtime: data.runtime || null,
      seasons: data.number_of_seasons || null,
      episodes: data.number_of_episodes || null,
      status: data.status || "",
      tagline: data.tagline || null,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
