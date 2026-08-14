import { supabase } from "@/lib/supabase";
import type { Room, RoomMember, MediaType } from "@/types";

const ROOM_COLORS = [
  "#8b5cf6", // violeta
  "#ec4899", // rosa
  "#f59e0b", // ámbar
  "#10b981", // esmeralda
  "#3b82f6", // azul
  "#ef4444", // rojo
  "#06b6d4", // cian
  "#a855f7", // púrpura
  "#f97316", // naranja
  "#14b8a6", // teal
];

export function randomRoomColor(): string {
  return ROOM_COLORS[Math.floor(Math.random() * ROOM_COLORS.length)];
}

export interface CreateRoomResult {
  room: Room;
  hostMember: RoomMember;
}

export async function createRoom(userId: string, name?: string): Promise<CreateRoomResult> {
  const inviteCode = cryptoRandomCode();
  const livekitRoomName = `room_${crypto.randomUUID()}`;

  const { data: room, error: roomErr } = await supabase
    .from("watch_rooms")
    .insert({
      host_user_id: userId,
      name: (name && name.trim()) || "Mi sala",
      color: randomRoomColor(),
      invite_code: inviteCode,
      livekit_room_name: livekitRoomName,
      max_participants: 8,
      status: "open",
    })
    .select("*")
    .single();
  if (roomErr) throw roomErr;

  const { data: hostMember, error: memberErr } = await supabase
    .from("watch_room_members")
    .insert({
      room_id: room.id,
      user_id: userId,
      role: "host",
    })
    .select("*")
    .single();
  if (memberErr) throw memberErr;

  return { room: room as Room, hostMember: hostMember as RoomMember };
}

export async function getMyRooms(userId: string): Promise<Room[]> {
  const { data, error } = await supabase
    .from("watch_rooms")
    .select("*")
    .eq("host_user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Room[];
}

export async function renameRoom(roomId: string, name: string): Promise<Room> {
  const trimmed = name.trim();
  const { data, error } = await supabase
    .from("watch_rooms")
    .update({ name: trimmed || "Mi sala" })
    .eq("id", roomId)
    .select("*")
    .single();
  if (error) throw error;
  return data as Room;
}

export async function deleteRoom(roomId: string): Promise<void> {
  const { error } = await supabase.from("watch_rooms").delete().eq("id", roomId);
  if (error) throw error;
}

export async function getRoomById(roomId: string): Promise<Room | null> {
  const { data, error } = await supabase
    .from("watch_rooms")
    .select("*")
    .eq("id", roomId)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as Room | null;
}

export async function getRoomMembers(roomId: string): Promise<RoomMember[]> {
  const { data, error } = await supabase
    .from("watch_room_members")
    .select("*")
    .eq("room_id", roomId)
    .is("removed_at", null)
    .order("joined_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as RoomMember[];
}

export async function setMemberLeft(roomId: string, userId: string): Promise<void> {
  await supabase
    .from("watch_room_members")
    .update({ left_at: new Date().toISOString() })
    .eq("room_id", roomId)
    .eq("user_id", userId);
}

export interface RoomTokenResponse {
  token: string;
  url: string;
  roomName: string;
  role: "host" | "guest";
  room: { id: string; name: string; maxParticipants: number };
}

export async function joinRoom(
  _userId: string,
  payload: { room_id?: string; invite_code?: string }
): Promise<RoomTokenResponse> {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/room-token`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "No se pudo unir a la sala");
  }
  return body as RoomTokenResponse;
}

export async function controlRoom(
  roomId: string,
  action: "start" | "end" | "kick",
  extra?: { user_id?: string }
): Promise<unknown> {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/room-control`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ room_id: roomId, action, ...(extra ?? {}) }),
    }
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "No se pudo aplicar la acción");
  return body;
}

export function roomInviteLink(room: { id: string }): string {
  return `${window.location.origin}/salas/${room.id}`;
}

function cryptoRandomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const buf = new Uint8Array(8);
  crypto.getRandomValues(buf);
  for (const b of buf) out += chars[b % chars.length];
  return out;
}

export const MEDIA_TYPE_LABEL: Record<MediaType, string> = {
  movie: "Película",
  tv: "Serie",
};
