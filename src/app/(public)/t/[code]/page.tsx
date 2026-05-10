import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import JoinPage from "./JoinPage";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function TournamentPublicPage({ params }: Props) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name, status, max_players, join_code")
    .eq("join_code", code)
    .single();

  if (!tournament) notFound();

  const { data: players } = await supabase
    .from("tournament_players")
    .select("id, user_id")
    .eq("tournament_id", tournament.id);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("name")
      .eq("id", user.id)
      .single();
    userName = profile?.name ?? null;
  }

  const playerCount = players?.length ?? 0;
  const alreadyJoined =
    !!user && (players?.some((p) => p.user_id === user.id) ?? false);

  return (
    <JoinPage
      tournament={tournament}
      playerCount={playerCount}
      alreadyJoined={alreadyJoined}
      user={user ? { id: user.id } : null}
      userName={userName}
    />
  );
}
