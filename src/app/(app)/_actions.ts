"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  for (let i = 0; i < 5; i++) {
    const { data, error } = await supabase
      .from("tournaments")
      .insert({ name, max_players: maxPlayers, manager_id: user.id, join_code: generateJoinCode() })
      .select("id")
      .single();

    if (data) return { id: data.id };
    if (error?.code !== "23505") return { error: error?.message ?? "Failed to create tournament" };
  }
  return { error: "Could not generate a unique join code. Please try again." };
}
