import { supabase } from "@/lib/supabase";
import type { UserAvatar } from "@/types";

let cache: UserAvatar[] | null = null;

export async function getAvatars(): Promise<UserAvatar[]> {
  if (cache) return cache;
  const { data, error } = await supabase
    .from("avatars")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  cache = (data ?? []) as UserAvatar[];
  return cache;
}

export async function getAvatarById(id: number | string | null | undefined): Promise<UserAvatar | undefined> {
  if (id == null) return undefined;
  const list = await getAvatars();
  return list.find((a) => String(a.id) === String(id));
}
