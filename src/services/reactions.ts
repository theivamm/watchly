import { supabase } from "@/lib/supabase";
import type { ReactionTag, SessionReaction } from "@/types";

export async function getReactionTags(): Promise<ReactionTag[]> {
  const { data, error } = await supabase
    .from("reaction_tags")
    .select("id, slug, name, is_active, created_at")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    is_active: r.is_active,
    created_at: r.created_at,
  }));
}

export async function getSessionReactions(sessionId: string): Promise<SessionReaction[]> {
  const { data, error } = await supabase
    .from("viewing_session_reactions")
    .select("viewing_session_id, reaction_tag_id, created_at, reaction_tags!inner(slug, name)")
    .eq("viewing_session_id", sessionId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    viewing_session_id: r.viewing_session_id as string,
    reaction_tag_id: r.reaction_tag_id as string,
    reaction_slug: (r.reaction_tags as unknown as { slug: string }).slug,
    reaction_name: (r.reaction_tags as unknown as { name: string }).name,
    created_at: r.created_at as string,
  }));
}

export async function addReaction(sessionId: string, reactionTagId: string): Promise<void> {
  const { error } = await supabase.from("viewing_session_reactions").insert({
    viewing_session_id: sessionId,
    reaction_tag_id: reactionTagId,
  });
  if (error) throw error;
}

export async function removeReaction(sessionId: string, reactionTagId: string): Promise<void> {
  const { error } = await supabase
    .from("viewing_session_reactions")
    .delete()
    .eq("viewing_session_id", sessionId)
    .eq("reaction_tag_id", reactionTagId);
  if (error) throw error;
}
