import { createClient } from "npm:@supabase/supabase-js@2";
import { AccessToken } from "npm:livekit-server-sdk@^2";

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

export interface RoomTokenResponse {
  token: string;
  url: string;
  roomName: string;
  role: "host" | "guest";
  room: {
    id: string;
    name: string;
    maxParticipants: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const livekitUrl = Deno.env.get("LIVEKIT_URL");
  const livekitApiKey = Deno.env.get("LIVEKIT_API_KEY");
  const livekitApiSecret = Deno.env.get("LIVEKIT_API_SECRET");

  if (!supabaseUrl || !supabaseAnonKey || !serviceKey) {
    return json({ error: "Faltan variables de entorno de Supabase" }, 500);
  }
  if (!livekitUrl || !livekitApiKey || !livekitApiSecret) {
    return json({ error: "LiveKit no está configurado" }, 503);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return json({ error: "No autorizado" }, 401);
  }
  const userId = user.id;

  const db = createClient(supabaseUrl, serviceKey);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Cuerpo inválido" }, 400);
  }

  const roomId = (body.room_id as string) ?? (body.id as string);
  const inviteCode = (body.invite_code as string) ?? (body.code as string);

  // === Resolve room ===
  let room;
  if (roomId) {
    const { data, error } = await db
      .from("watch_rooms")
      .select("*")
      .eq("id", roomId)
      .single();
    if (error) return json({ error: "Sala no encontrada" }, 404);
    room = data as Record<string, unknown>;
  } else if (inviteCode) {
    const { data, error } = await db
      .from("watch_rooms")
      .select("*")
      .eq("invite_code", inviteCode)
      .single();
    if (error) return json({ error: "Sala no encontrada" }, 404);
    room = data as Record<string, unknown>;
  } else {
    return json({ error: "Debe indicar room_id o invite_code" }, 400);
  }

  const status = room.status as string;
  const endedAt = room.ended_at;
  if (status === "ended" || endedAt) {
    return json({ error: "La sala finalizó" }, 410);
  }

  const hostUserId = room.host_user_id as string;
  const maxParticipants = Number(room.max_participants) || 8;

  // === Determine role ===
  let role: "host" | "guest";
  if (userId === hostUserId) {
    role = "host";
  } else {
    // Reingreso permitido: las salas son permanentes. Solo un usuario
    // expulsado (removed_at) queda bloqueado. Si solo marcó left_at al
    // salir, se reactiva la membresía.
    const { data: membership } = await db
      .from("watch_room_members")
      .select("*")
      .eq("room_id", room.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (membership) {
      const m = membership as Record<string, unknown>;
      if (m.removed_at) {
        return json({ error: "No podés unirte a esta sala" }, 403);
      }
      if (m.left_at) {
        await db
          .from("watch_room_members")
          .update({ left_at: null, removed_at: null })
          .eq("room_id", room.id)
          .eq("user_id", userId);
      }
    } else {
      // Auto-enroll guest
      const { data: activeCount } = await db
        .from("watch_room_members")
        .select("id", { count: "exact", head: true })
        .eq("room_id", room.id)
        .is("left_at", null)
        .is("removed_at", null);

      if (Number(activeCount ?? 0) >= maxParticipants) {
        return json({ error: "La sala está llena" }, 409);
      }

      await db.from("watch_room_members").insert({
        room_id: room.id,
        user_id: userId,
        role: "guest",
      });
    }
    role = "guest";
  }

  const livekitRoom = room.livekit_room_name as string;

  // Build LiveKit access token with role-based permissions.
  // The secret never leaves this backend; the client only receives the JWT.
  const token = new AccessToken(livekitApiKey as string, livekitApiSecret as string, {
    identity: `${role}:${userId}`,
    ttl: 60 * 60, // 1h
  });
  token.addGrant({
    roomJoin: true,
    room: livekitRoom,
    ...(role === "host"
      ? {
          roomAdmin: true,
          canPublish: true,
          canPublishData: true,
          canSubscribe: true,
        }
      : {
          roomAdmin: false,
          canPublish: false,
          canPublishData: true,
          canSubscribe: true,
        }),
  });

  const jwt = await token.toJwt();

  return json({
    token: jwt,
    url: livekitUrl,
    roomName: livekitRoom,
    role,
    room: {
      id: room.id,
      name: room.name,
      maxParticipants,
    },
  } satisfies RoomTokenResponse);
});
