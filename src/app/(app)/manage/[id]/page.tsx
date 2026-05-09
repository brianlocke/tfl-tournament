import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TournamentDetail from "@/components/tournament/TournamentDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ManageTournamentPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: tournament }, { data: players }] = await Promise.all([
    supabase.from("tournaments").select("*").eq("id", id).single(),
    supabase
      .from("tournament_players")
      .select("*, users(name)")
      .eq("tournament_id", id)
      .order("seed", { ascending: true, nullsFirst: false })
      .order("joined_at", { ascending: true }),
  ]);

  if (!tournament) notFound();

  return (
    <TournamentDetail
      tournament={tournament}
      players={players ?? []}
      isManager={tournament.manager_id === user.id}
    />
  );
}
