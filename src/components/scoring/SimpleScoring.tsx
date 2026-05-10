"use client";

import { useState } from "react";
import { LayoutGrid, Trophy } from "lucide-react";
import type { MatchConfig } from "./ScoringScreen";

const WIN_THRESHOLD = 30;

type Player = "p1" | "p2";

export default function SimpleScoring({
  config,
  onSwitchToFull,
}: {
  config: MatchConfig;
  onSwitchToFull: () => void;
}) {
  const [scores, setScores] = useState<Record<Player, number>>({ p1: 0, p2: 0 });
  const [winner, setWinner] = useState<Player | null>(null);

  function add(player: Player) {
    if (winner) return;
    setScores((s) => {
      const next = s[player] + 1;
      if (next > WIN_THRESHOLD) setWinner(player);
      return { ...s, [player]: next };
    });
  }

  function sub(player: Player) {
    setScores((s) => ({ ...s, [player]: Math.max(0, s[player] - 1) }));
    if (winner === player) setWinner(null);
  }

  function reset() {
    setScores({ p1: 0, p2: 0 });
    setWinner(null);
  }

  const name = (p: Player) => (p === "p1" ? config.p1Name : config.p2Name);

  return (
    <div className="h-dvh flex flex-col bg-black text-white overflow-hidden select-none">
      {/* Thin header */}
      <header className="flex-shrink-0 flex items-center justify-between px-3 py-1.5 border-b border-white/10 bg-black z-10">
        <span className="text-[10px] font-display tracking-wider text-slate-400 truncate">
          {config.tournamentName} · {config.round}
        </span>
        <button
          onClick={onSwitchToFull}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] uppercase tracking-wider text-slate-300 flex-shrink-0 transition-colors"
        >
          <LayoutGrid className="w-3 h-3" />
          Full Scoring
        </button>
      </header>

      {/* P2 — top half, rotated so they can read it from across the table */}
      <HalfPanel
        name={name("p2")}
        score={scores.p2}
        isWinner={winner === "p2"}
        color="blue"
        flipped
        onAdd={() => add("p2")}
        onSub={() => sub("p2")}
      />

      <div className="flex-shrink-0 h-px bg-white/10" />

      {/* P1 — bottom half */}
      <HalfPanel
        name={name("p1")}
        score={scores.p1}
        isWinner={winner === "p1"}
        color="red"
        onAdd={() => add("p1")}
        onSub={() => sub("p1")}
      />

      {winner && (
        <WinOverlay
          name={name(winner)}
          color={winner === "p1" ? "red" : "blue"}
          score={scores[winner]}
          oppScore={scores[winner === "p1" ? "p2" : "p1"]}
          onConfirm={reset}
        />
      )}
    </div>
  );
}

function HalfPanel({
  name,
  score,
  isWinner,
  color,
  flipped = false,
  onAdd,
  onSub,
}: {
  name: string;
  score: number;
  isWinner: boolean;
  color: "red" | "blue";
  flipped?: boolean;
  onAdd: () => void;
  onSub: () => void;
}) {
  const cfg = {
    red: {
      bg: "from-red-950/50 to-black",
      activeOverlay: "active:bg-red-500/10",
      scoreColor: "text-red-400",
      nameBg: "bg-red-600",
      minus: "bg-red-950/80 border-red-800/60 text-red-300 active:bg-red-900/80",
    },
    blue: {
      bg: "from-blue-950/50 to-black",
      activeOverlay: "active:bg-blue-500/10",
      scoreColor: "text-blue-400",
      nameBg: "bg-blue-600",
      minus: "bg-blue-950/80 border-blue-800/60 text-blue-300 active:bg-blue-900/80",
    },
  }[color];

  return (
    <section
      className={`relative flex-1 min-h-0 bg-gradient-to-b ${cfg.bg} ${flipped ? "rotate-180" : ""}`}
    >
      {/* Full-area tap target for +1 */}
      <button
        onClick={onAdd}
        className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-2 transition-colors ${cfg.activeOverlay}`}
      >
        <span
          className={`text-[11px] font-bold tracking-[0.25em] uppercase px-3 py-1 rounded-full ${cfg.nameBg} text-white`}
        >
          {name}
        </span>
        <span
          className={`font-scoreboard font-black leading-none tabular-nums ${cfg.scoreColor} ${isWinner ? "animate-pulse" : ""}`}
          style={{ fontSize: "clamp(72px, 28vw, 160px)" }}
        >
          {String(score).padStart(2, "0")}
        </span>
        {isWinner && (
          <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.3em] text-amber-400 uppercase">
            <Trophy className="w-3 h-3" /> Winner
          </span>
        )}
      </button>

      {/* Minus button — bottom-right from this player's perspective */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSub();
        }}
        className={`absolute bottom-4 right-4 w-12 h-12 rounded-full border ${cfg.minus} flex items-center justify-center text-2xl font-bold leading-none transition-all active:scale-90 z-10`}
      >
        −
      </button>
    </section>
  );
}

function WinOverlay({
  name,
  color,
  score,
  oppScore,
  onConfirm,
}: {
  name: string;
  color: "red" | "blue";
  score: number;
  oppScore: number;
  onConfirm: () => void;
}) {
  const accent = color === "red" ? "text-red-400" : "text-blue-400";
  const bg = color === "red" ? "from-red-950" : "from-blue-950";

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
      <div
        className={`w-full max-w-sm bg-gradient-to-br ${bg} to-black border border-white/10 rounded-2xl p-6 text-center`}
      >
        <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <div className="text-xs uppercase tracking-[0.3em] text-amber-400 mb-1">
          Match Complete
        </div>
        <div className="font-display text-4xl tracking-wide mb-1">{name}</div>
        <div className="text-sm text-slate-400 mb-5">wins the match</div>
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className={`font-scoreboard font-black text-5xl ${accent}`}>{score}</div>
          <div className="font-display text-2xl text-slate-600">—</div>
          <div className="font-scoreboard font-black text-5xl text-slate-500">{oppScore}</div>
        </div>
        <button
          onClick={onConfirm}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 font-display tracking-wider text-black transition-all"
        >
          CONFIRM &amp; ADVANCE BRACKET
        </button>
      </div>
    </div>
  );
}
