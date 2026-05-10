"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateBracket } from "@/lib/bracket";

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "TFL-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createTournament(
  name: string,
  maxPlayers: number
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  for (let i = 0; i < 5; i++) {
    const { data, error } = await supabase
      .from("tournaments")
      .insert({
        name,
        max_players: maxPlayers,
        manager_id: user.id,
        join_code: generateJoinCode(),
      })
      .select("id")
      .single();

    if (data) return { id: data.id };
    if (error?.code !== "23505")
      return { error: error?.message ?? "Failed to create tournament" };
  }
  return { error: "Could not generate a unique join code. Please try again." };
}

export async function updateSeeds(
  tournamentId: string,
  playerIds: string[]
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await Promise.all(
    playerIds.map((id, index) =>
      supabase
        .from("tournament_players")
        .update({ seed: index + 1 })
        .eq("id", id)
        .eq("tournament_id", tournamentId)
    )
  );

  revalidatePath(`/manage/${tournamentId}`);
  return {};
}

export async function startTournament(
  tournamentId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, status, join_code")
    .eq("id", tournamentId)
    .eq("manager_id", user.id)
    .single();

  if (!tournament) return { error: "Tournament not found" };
  if (tournament.status !== "registration")
    return { error: "Tournament is already started" };

  // Fetch players ordered by existing seed (nulls last), then join order
  const { data: rawPlayers } = await supabase
    .from("tournament_players")
    .select("id, seed")
    .eq("tournament_id", tournamentId)
    .order("seed", { ascending: true, nullsFirst: false })
    .order("joined_at", { ascending: true });

  const players = rawPlayers ?? [];
  if (players.length < 2) return { error: "Need at least 2 players to start" };

  // Assign sequential seeds 1..N (respects any existing ordering)
  const seededPlayers = players.map((p, i) => ({ id: p.id, seed: i + 1 }));

  await Promise.all(
    seededPlayers.map((p) =>
      supabase
        .from("tournament_players")
        .update({ seed: p.seed })
        .eq("id", p.id)
    )
  );

  // Generate WB R1 matches
  const matches = generateBracket(seededPlayers, tournamentId);
  const { error: matchError } = await supabase.from("matches").insert(matches);
  if (matchError) return { error: matchError.message };

  // Flip to active
  const { error: updateError } = await supabase
    .from("tournaments")
    .update({ status: "active" })
    .eq("id", tournamentId);

  if (updateError) return { error: updateError.message };

  revalidatePath(`/manage/${tournamentId}`);
  return {};
}
