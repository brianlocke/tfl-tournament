"use client";

import { useState } from "react";
import ScoringScreen, { type MatchConfig } from "@/components/scoring/ScoringScreen";
import SimpleScoring from "@/components/scoring/SimpleScoring";

const DEMO_CONFIG: Omit<MatchConfig, "onSwitchToSimple"> = {
  tournamentName: "FRIDAY NIGHT FLICKS",
  round: "WINNERS R2",
  p1Name: "Marcus T.",
  p2Name: "Sam K.",
};

export default function MatchScoringPage() {
  const [mode, setMode] = useState<"simple" | "full">("simple");

  if (mode === "full") {
    return (
      <ScoringScreen
        config={{ ...DEMO_CONFIG, onSwitchToSimple: () => setMode("simple") }}
      />
    );
  }

  return (
    <SimpleScoring config={DEMO_CONFIG} onSwitchToFull={() => setMode("full")} />
  );
}
