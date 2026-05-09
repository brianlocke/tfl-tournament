import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TournamentDashboard from "@/components/tournament/TournamentDashboard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("*, tournament_players(id)")
    .eq("manager_id", user.id)
    .order("created_at", { ascending: false });

  return <TournamentDashboard tournaments={tournaments ?? []} />;
}
