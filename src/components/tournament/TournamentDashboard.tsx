"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ChevronRight, Users, Activity, Calendar, Crown, Trophy } from "lucide-react";
import CreateTournamentModal from "./CreateTournamentModal";

interface TournamentRow {
  id: string;
  name: string;
  status: "registration" | "active" | "complete";
  max_players: number;
  join_code: string;
  created_at: string;
  tournament_players: { id: string }[];
}

export default function TournamentDashboard({ tournaments }: { tournaments: TournamentRow[] }) {
  const [showCreate, setShowCreate] = useState(false);

  const active = tournaments.filter((t) => t.status === "active").length;
  const totalPlayers = tournaments.reduce((sum, t) => sum + t.tournament_players.length, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
      {/* Hero */}
      <section className="pt-8 pb-6">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-2">Manager Dashboard</div>
        <h1 className="font-display text-5xl sm:text-6xl leading-none">
          YOUR <span className="text-red-500">TOURNAMENTS</span>
        </h1>
        <p className="text-slate-400 mt-3 max-w-md">Run brackets. Track scores. Crown champions.</p>
      </section>

      {/* Stats strip */}
      <section className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
        <StatTile label="Active" value={String(active)} sub="tournaments" accent="emerald" />
        <StatTile label="Players" value={String(totalPlayers)} sub="across all" accent="blue" />
        <StatTile label="Total" value={String(tournaments.length)} sub="tournaments" accent="red" />
      </section>

      {/* Create CTA */}
      <button
        onClick={() => setShowCreate(true)}
        className="w-full mb-8 group relative overflow-hidden rounded-lg border-2 border-red-600 bg-gradient-to-r from-red-600/20 to-red-700/10 hover:from-red-600/30 hover:to-red-700/20 transition-all p-5 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded bg-red-600 flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
            <Plus className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="font-display text-2xl tracking-wide">CREATE TOURNAMENT</div>
            <div className="text-xs text-slate-400">Generate a join link in seconds</div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-red-500 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Tournament list */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl tracking-wide text-slate-300">ALL TOURNAMENTS</h2>
          <span className="text-xs text-slate-500 font-mono">{tournaments.length} TOTAL</span>
        </div>

        {tournaments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 p-12 text-center">
            <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 mb-1">No tournaments yet</p>
            <p className="text-xs text-slate-600">Create your first one above</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {tournaments.map((t) => (
              <TournamentCard key={t.id} tournament={t} />
            ))}
          </div>
        )}
      </section>

      {showCreate && <CreateTournamentModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function StatTile({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: "emerald" | "blue" | "red" }) {
  const styles = {
    emerald: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
    blue: "text-blue-400 border-blue-500/30 bg-blue-500/5",
    red: "text-red-400 border-red-500/30 bg-red-500/5",
  };
  return (
    <div className={`rounded-lg border p-4 ${styles[accent]}`}>
      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-1">{label}</div>
      <div className="font-display text-4xl leading-none">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{sub}</div>
    </div>
  );
}

function TournamentCard({ tournament: t }: { tournament: TournamentRow }) {
  const statusConfig = {
    active: { label: "LIVE", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", pulse: true },
    registration: { label: "OPEN", color: "bg-blue-500/20 text-blue-300 border-blue-500/40", pulse: false },
    complete: { label: "FINAL", color: "bg-slate-700/50 text-slate-400 border-slate-600", pulse: false },
  };
  const cfg = statusConfig[t.status];
  const playerCount = t.tournament_players.length;
  const createdAt = new Date(t.created_at);
  const age = formatAge(createdAt);

  return (
    <Link
      href={`/manage/${t.id}`}
      className="group w-full text-left rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-white/15 p-4 sm:p-5 transition-all block"
      style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent 0, transparent 38px, rgba(255,255,255,0.025) 38px, rgba(255,255,255,0.025) 39px)" }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[10px] font-bold tracking-[0.15em] px-2 py-0.5 rounded border ${cfg.color} flex items-center gap-1.5`}>
              {cfg.pulse && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />}
              {cfg.label}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">{t.join_code}</span>
          </div>
          <h3 className="font-display text-2xl tracking-wide truncate">{t.name}</h3>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          <span className="font-mono">{playerCount}/{t.max_players}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          <span className="font-mono">0 matches</span>
        </span>
        <span className="hidden sm:flex items-center gap-1.5 ml-auto">
          <Calendar className="w-3.5 h-3.5" />
          {age}
        </span>
      </div>

      {t.status === "complete" && (
        <div className="flex items-center gap-1.5 mt-2 text-amber-400 text-xs">
          <Crown className="w-3.5 h-3.5" />
          <span>Complete</span>
        </div>
      )}
    </Link>
  );
}

function formatAge(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
