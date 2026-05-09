"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Settings, Share2, Copy, Check,
  Users, Activity, Trophy, Flame, Shield,
  GripVertical, Play, Crown,
} from "lucide-react";

interface Tournament {
  id: string;
  name: string;
  status: "registration" | "active" | "complete";
  max_players: number;
  join_code: string;
  manager_id: string;
}

interface Player {
  id: string;
  user_id: string | null;
  guest_name: string | null;
  seed: number | null;
  bracket_status: "active" | "losers" | "eliminated" | "champion";
  joined_at: string;
  users: { name: string } | null;
}

type Tab = "lobby" | "bracket" | "matches";

export default function TournamentDetail({
  tournament,
  players,
  isManager,
}: {
  tournament: Tournament;
  players: Player[];
  isManager: boolean;
}) {
  const [tab, setTab] = useState<Tab>("lobby");
  const [copied, setCopied] = useState(false);

  const joinUrl = typeof window !== "undefined"
    ? `${window.location.origin}/t/${tournament.join_code}`
    : `/t/${tournament.join_code}`;

  function copyLink() {
    navigator.clipboard.writeText(joinUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const statusConfig = {
    registration: { label: "OPEN", color: "bg-blue-500/20 text-blue-300 border-blue-500/40", pulse: false },
    active: { label: "LIVE", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", pulse: true },
    complete: { label: "FINAL", color: "bg-slate-700/50 text-slate-400 border-slate-600", pulse: false },
  };
  const cfg = statusConfig[tournament.status];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
      <Link
        href="/dashboard"
        className="mt-6 mb-4 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All tournaments
      </Link>

      {/* Header card */}
      <section
        className="rounded-lg bg-gradient-to-br from-slate-900 to-slate-900/40 border border-white/5 p-5 sm:p-6 mb-6"
        style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent 0, transparent 38px, rgba(255,255,255,0.025) 38px, rgba(255,255,255,0.025) 39px)" }}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-bold tracking-[0.15em] px-2 py-0.5 rounded border ${cfg.color} flex items-center gap-1.5`}>
                {cfg.pulse && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />}
                {cfg.label}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{tournament.join_code}</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl tracking-wide leading-none truncate">
              {tournament.name}
            </h1>
          </div>
          {isManager && (
            <button className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center flex-shrink-0">
              <Settings className="w-4 h-4 text-slate-300" />
            </button>
          )}
        </div>

        {/* Share link */}
        <div className="flex items-stretch gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 bg-black/30 border border-white/5 rounded-lg px-3 py-2 min-w-0">
            <Share2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span className="text-sm font-mono text-slate-300 truncate">/t/{tournament.join_code}</span>
          </div>
          <button
            onClick={copyLink}
            className={`px-4 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
              copied ? "bg-emerald-500 text-white" : "bg-red-600 hover:bg-red-500 text-white"
            }`}
          >
            {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
          </button>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <MiniStat value={`${players.length}/${tournament.max_players}`} label="Players" icon={Users} />
          <MiniStat value="0/0" label="Matches" icon={Activity} />
          <MiniStat value="DBL ELIM" label="Format" icon={Trophy} />
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-white/5">
        {([
          { id: "lobby", label: "Lobby", icon: Users },
          { id: "bracket", label: "Bracket", icon: Shield },
          { id: "matches", label: "Matches", icon: Flame },
        ] as const).map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === item.id
                ? "border-red-500 text-white"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>

      {tab === "lobby" && (
        <LobbyTab
          players={players}
          tournament={tournament}
          isManager={isManager}
        />
      )}
      {tab === "bracket" && <PlaceholderTab message="Bracket generates when the tournament starts." icon={Shield} />}
      {tab === "matches" && <PlaceholderTab message="Matches will appear here once the tournament is active." icon={Flame} />}
    </div>
  );
}

function MiniStat({ value, label, icon: Icon }: { value: string; label: string; icon: React.ElementType }) {
  return (
    <div className="bg-black/20 rounded-lg border border-white/5 px-3 py-3">
      <Icon className="w-3.5 h-3.5 text-slate-500 mx-auto mb-1.5" />
      <div className="font-display text-xl leading-none">{value}</div>
      <div className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function LobbyTab({
  players,
  tournament,
  isManager,
}: {
  players: Player[];
  tournament: Tournament;
  isManager: boolean;
}) {
  const canStart = isManager && players.length >= 2 && tournament.status === "registration";

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-lg tracking-wide text-slate-300">
          {players.length === 0 ? "WAITING FOR PLAYERS" : "PLAYERS"}
        </h3>
        <span className="text-xs text-slate-500 font-mono">
          {players.length}/{tournament.max_players}
        </span>
      </div>

      {players.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 p-10 text-center mb-5">
          <Users className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm mb-1">No players yet</p>
          <p className="text-xs text-slate-600">Share the join link above to invite players</p>
        </div>
      ) : (
        <div className="space-y-2 mb-5">
          {players.map((p, i) => {
            const displayName = p.users?.name ?? p.guest_name ?? "Unknown";
            const isGuest = !p.user_id;
            const seed = p.seed ?? i + 1;

            return (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/60 border border-white/5"
              >
                <GripVertical className="w-4 h-4 text-slate-600" />
                <div
                  className={`w-8 h-8 rounded font-display text-lg flex items-center justify-center flex-shrink-0 ${
                    seed === 1 ? "bg-amber-500 text-slate-950" : seed <= 4 ? "bg-red-600 text-white" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {seed}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{displayName}</span>
                    {isGuest && (
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
                        Guest
                      </span>
                    )}
                    {p.bracket_status === "champion" && (
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isManager && tournament.status === "registration" && (
        <button
          disabled={!canStart}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-30 disabled:cursor-not-allowed font-display tracking-wider text-lg transition-all flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5" />
          {players.length < 2 ? `NEED AT LEAST 2 PLAYERS` : "START TOURNAMENT"}
        </button>
      )}
    </div>
  );
}

function PlaceholderTab({ message, icon: Icon }: { message: string; icon: React.ElementType }) {
  return (
    <div className="rounded-lg border border-dashed border-white/10 p-12 text-center">
      <Icon className="w-8 h-8 text-slate-600 mx-auto mb-3" />
      <p className="text-slate-500 text-sm">{message}</p>
    </div>
  );
}
