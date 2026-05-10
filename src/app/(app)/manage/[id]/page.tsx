import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TournamentDetail, { type Match } from "@/components/tournament/TournamentDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ManageTournamentPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: tournament }, { data: players }, { data: matches }] =
    await Promise.all([
      supabase.from("tournaments").select("*").eq("id", id).single(),
      supabase
        .from("tournament_players")
        .select("*, users(name)")
        .eq("tournament_id", id)
        .order("seed", { ascending: true, nullsFirst: false })
        .order("joined_at", { ascending: true }),
      supabase
        .from("matches")
        .select(
          `id, bracket, round, position, status, winner_id,
           player1:tournament_players!player1_id(id, guest_name, users(name)),
           player2:tournament_players!player2_id(id, guest_name, users(name)),
           scoring_events(player_id, points)`
        )
        .eq("tournament_id", id)
        .order("bracket")
        .order("round")
        .order("position"),
    ]);

  if (!tournament) notFound();

  return (
    <TournamentDetail
      tournament={tournament}
      players={players ?? []}
      matches={(matches ?? []) as unknown as Match[]}
      isManager={tournament.manager_id === user.id}
    />
  );
}
