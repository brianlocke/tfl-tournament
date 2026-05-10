"use server";

import { createClient } from "@/lib/supabase/server";

export async function joinAsUser(
  tournamentId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  // Pre-check: already joined?
  const { data: existing } = await supabase
    .from("tournament_players")
    .select("id")
    .eq("tournament_id", tournamentId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) return { error: "already_joined" };

  // Pre-check: open and not full
  const { data: t } = await supabase
    .from("tournaments")
    .select("status, max_players")
    .eq("id", tournamentId)
    .single();
  if (!t) return { error: "Tournament not found" };
  if (t.status !== "registration") return { error: "Tournament is not open for registration" };

  const { count } = await supabase
    .from("tournament_players")
    .select("id", { count: "exact", head: true })
    .eq("tournament_id", tournamentId);
  if ((count ?? 0) >= t.max_players) return { error: "Tournament is full" };

  const { error } = await supabase
    .from("tournament_players")
    .insert({ tournament_id: tournamentId, user_id: user.id });

  if (error) return { error: error.message };
  return {};
}

export async function joinAsGuest(
  tournamentId: string,
  guestName: string
): Promise<{ error?: string }> {
  const name = guestName.trim();
  if (!name) return { error: "Name is required" };
  if (name.length > 30) return { error: "Name must be 30 characters or less" };

  const supabase = await createClient();

  // Pre-checks (RLS also enforces these, but give a friendly message first)
  const { data: t } = await supabase
    .from("tournaments")
    .select("status, max_players")
    .eq("id", tournamentId)
    .single();
  if (!t) return { error: "Tournament not found" };
  if (t.status !== "registration") return { error: "Tournament is not open for registration" };

  const { count } = await supabase
    .from("tournament_players")
    .select("id", { count: "exact", head: true })
    .eq("tournament_id", tournamentId);
  if ((count ?? 0) >= t.max_players) return { error: "Tournament is full" };

  const { error } = await supabase
    .from("tournament_players")
    .insert({ tournament_id: tournamentId, guest_name: name });

  if (error) return { error: error.message };
  return {};
}
