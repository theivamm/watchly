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
    const query = url.searchParams.get("q");
    const type = url.searchParams.get("type") || "all";
    const page = url.searchParams.get("page") || "1";

    if (!query || query.length < 3) {
      return new Response(
        JSON.stringify({ error: "Query must be at least 3 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let endpoint = "/search/multi";
    if (type === "movie") endpoint = "/search/movie";
    if (type === "tv") endpoint = "/search/tv";

    const params = new URLSearchParams({
      query,
      page,
      include_adult: "false",
      language: "es-AR",
    });

    const response = await fetch(`${TMDB_BASE}${endpoint}?${params}`, {
      headers: {
        Authorization: `Bearer ${TMDB_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    const results = (data.results || [])
      .filter((r: Record<string, unknown>) => {
        if (type === "all") return r.media_type === "movie" || r.media_type === "tv";
        return true;
      })
      .slice(0, 20)
      .map((r: Record<string, unknown>) => ({
        tmdbId: r.id,
        mediaType: r.media_type || type,
        title: r.title || r.name || "",
        originalTitle: r.original_title || r.original_name || "",
        overview: r.overview || "",
        year: ((r.release_date || r.first_air_date) as string || "").substring(0, 4) || null,
        releaseDate: r.release_date || r.first_air_date || null,
        posterPath: r.poster_path,
        backdropPath: r.backdrop_path,
        genreIds: r.genre_ids || [],
        tmdbRating: r.vote_average || null,
      }));

    return new Response(
      JSON.stringify({ results, totalResults: data.total_results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (_err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
