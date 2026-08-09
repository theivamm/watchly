import { supabase } from "@/lib/supabase";
import type { List, ListItem, ListWithItems, MediaType } from "@/types";

interface CreateListParams {
  name: string;
  description?: string;
  isPublic?: boolean;
}

interface UpdateListParams {
  name?: string;
  description?: string;
  is_public?: boolean;
}

interface AddItemParams {
  tmdb_id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path?: string | null;
}

export async function createList(userId: string, params: CreateListParams): Promise<List> {
  const { data, error } = await supabase
    .from("lists")
    .insert({
      user_id: userId,
      name: params.name,
      description: params.description ?? null,
      is_public: params.isPublic ?? false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserLists(userId: string): Promise<List[]> {
  const { data, error } = await supabase
    .from("lists")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getPublicLists(userId: string): Promise<List[]> {
  const { data, error } = await supabase
    .from("lists")
    .select("*")
    .eq("user_id", userId)
    .eq("is_public", true)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getList(listId: string): Promise<ListWithItems> {
  const { data: list, error: listError } = await supabase
    .from("lists")
    .select("*")
    .eq("id", listId)
    .single();

  if (listError) throw listError;

  const { data: items, error: itemsError } = await supabase
    .from("list_items")
    .select("*")
    .eq("list_id", listId)
    .order("added_at", { ascending: false });

  if (itemsError) throw itemsError;

  return { ...list, items: items ?? [] };
}

export async function updateList(
  listId: string,
  updates: UpdateListParams
): Promise<List> {
  const { data, error } = await supabase
    .from("lists")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", listId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteList(listId: string): Promise<void> {
  const { error } = await supabase.from("lists").delete().eq("id", listId);
  if (error) throw error;
}

export async function addItemToList(
  listId: string,
  item: AddItemParams
): Promise<ListItem> {
  const { data, error } = await supabase
    .from("list_items")
    .insert({
      list_id: listId,
      tmdb_id: item.tmdb_id,
      media_type: item.media_type,
      title: item.title,
      poster_path: item.poster_path ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeItemFromList(itemId: string): Promise<void> {
  const { error } = await supabase
    .from("list_items")
    .delete()
    .eq("id", itemId);

  if (error) throw error;
}

export async function removeItemFromListByTmdb(
  listId: string,
  tmdbId: number,
  mediaType: "movie" | "tv"
): Promise<void> {
  const { data, error } = await supabase
    .from("list_items")
    .select("id")
    .eq("list_id", listId)
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType)
    .maybeSingle();

  if (error) throw error;
  if (!data) return;

  await removeItemFromList(data.id);
}

export async function getListItemCount(listId: string): Promise<number> {
  const { count, error } = await supabase
    .from("list_items")
    .select("*", { count: "exact", head: true })
    .eq("list_id", listId);

  if (error) throw error;
  return count ?? 0;
}

export async function getListsContainingItem(
  userId: string,
  tmdbId: number,
  mediaType: MediaType
): Promise<string[]> {
  const { data, error } = await supabase
    .from("list_items")
    .select("list_id, lists!inner(id, user_id)")
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType)
    .eq("lists.user_id", userId);

  if (error) throw error;
  return (data ?? []).map((row) => (row as unknown as { list_id: string }).list_id);
}
