import ScoringScreen from "@/components/scoring/ScoringScreen";

const DEMO_CONFIG = {
  tournamentName: "FRIDAY NIGHT FLICKS",
  round: "WINNERS R2",
  p1Name: "Marcus T.",
  p2Name: "Sam K.",
};

export default function MatchScoringPage() {
  return <ScoringScreen config={DEMO_CONFIG} />;
}
