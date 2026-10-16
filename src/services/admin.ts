import { supabase } from "@/lib/supabase";

export interface AdminOverview {
  users_total: number;
  users_7d: number;
  users_confirmed: number;
  active_7d: number;
  onboarded: number;
  with_titles: number;
  entries_total: number;
  lists_total: number;
  sessions_total: number;
  dna_total: number;
  searches_7d: number;
  search_ms_p50_7d: number | null;
  write_fail_7d: number;
  library_add_7d: number;
  errors_24h: number;
  errors_open: number;
}

export interface AdminDay { day: string; signups: number; active_users: number; titles_added: number; errors: number }
export interface AdminFunnelWeek { week: string; signups: number; onboarded: number; first_title: number }
export interface AdminUser {
  id: string; email: string; created_at: string; last_sign_in_at: string | null; confirmed: boolean;
  provider: string; username: string | null; display_name: string | null; entries: number; has_dna: boolean; is_admin: boolean;
}
export interface AdminEventCount { event: string; total: number; users: number }
export interface ClientError {
  id: number; user_id: string | null; source: string; message: string; stack: string | null;
  path: string | null; user_agent: string | null; created_at: string; resolved_at: string | null;
}
export interface AnalyticsEvent { id: number; user_id: string | null; event: string; props: Record<string, unknown>; path: string | null; created_at: string }

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw error;
  return data as T;
}

export const checkIsAdmin = () => rpc<boolean>("is_admin").catch(() => false);
export const getOverview = () => rpc<AdminOverview>("admin_overview");
export const getDaily = (days = 30) => rpc<AdminDay[]>("admin_daily", { days });
export const getFunnel = () => rpc<AdminFunnelWeek[]>("admin_funnel");
export const getUsers = (q = "") => rpc<AdminUser[]>("admin_users", { q, lim: 200 });
export const getTopEvents = (days = 7) => rpc<AdminEventCount[]>("admin_top_events", { days });

export async function getErrors(includeResolved: boolean): Promise<ClientError[]> {
  let query = supabase.from("client_errors").select("*").order("created_at", { ascending: false }).limit(500);
  if (!includeResolved) query = query.is("resolved_at", null);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ClientError[];
}

export async function resolveErrors(message: string): Promise<void> {
  const { error } = await supabase.from("client_errors").update({ resolved_at: new Date().toISOString() })
    .eq("message", message).is("resolved_at", null);
  if (error) throw error;
}

export async function getRecentEvents(): Promise<AnalyticsEvent[]> {
  const { data, error } = await supabase.from("analytics_events").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) throw error;
  return (data ?? []) as AnalyticsEvent[];
}
