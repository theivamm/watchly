import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseAnonKey || !serviceKey) {
    return json({ error: "Faltan variables de entorno de Supabase" }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) return json({ error: "No autorizado" }, 401);

  const db = createClient(supabaseUrl, serviceKey);
  const userId = user.id;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Cuerpo inválido" }, 400);
  }

  const action = body.action as string;
  const roomId = (body.room_id as string) ?? (body.id as string);
  if (!roomId) return json({ error: "room_id requerido" }, 400);

  // Verify host ownership.
  const { data: room, error: roomErr } = await db
    .from("watch_rooms")
    .select("host_user_id, status, ended_at")
    .eq("id", roomId)
    .single();
  if (roomErr || !room) return json({ error: "Sala no encontrada" }, 404);

  if (String(room.host_user_id) !== userId) {
    return json({ error: "Solo el host puede realizar esta acción" }, 403);
  }

  if (room.status === "ended" || room.ended_at) {
    return json({ error: "La sala finalizó" }, 410);
  }

  switch (action) {
    case "start": {
      const { data, error } = await db
        .from("watch_rooms")
        .update({ status: "live", started_at: new Date().toISOString() })
        .eq("id", roomId)
        .select("id, status, started_at")
        .single();
      if (error) return json({ error: "No se pudo iniciar la sala" }, 500);
      return json({ room: data });
    }

    case "end": {
      const { data, error } = await db
        .from("watch_rooms")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", roomId)
        .select("id, status, ended_at")
        .single();
      if (error) return json({ error: "No se pudo finalizar la sala" }, 500);
      // Mark all active members as left (soft) so presence clears.
      await db
        .from("watch_room_members")
        .update({ left_at: new Date().toISOString() })
        .eq("room_id", roomId)
        .is("left_at", null);
      return json({ room: data });
    }

    case "kick": {
      const targetUserId = body.user_id as string;
      if (!targetUserId) return json({ error: "user_id requerido" }, 400);
      const { data, error } = await db
        .from("watch_room_members")
        .update({ removed_at: new Date().toISOString(), left_at: new Date().toISOString() })
        .eq("room_id", roomId)
        .eq("user_id", targetUserId)
        .eq("role", "guest")
        .is("removed_at", null)
        .select("id, user_id")
        .maybeSingle();
      if (error) return json({ error: "No se pudo expulsar al participante" }, 500);
      if (!data) return json({ error: "Participante no encontrado" }, 404);
      return json({ kicked: true });
    }

    default:
      return json({ error: "Acción desconocida" }, 400);
  }
});
