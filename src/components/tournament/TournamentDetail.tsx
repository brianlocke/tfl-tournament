"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Settings, Share2, Copy, Check,
  Users, Activity, Trophy, Flame, Shield,
  GripVertical, Play, Crown, Zap, Eye, Loader2,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@/lib/supabase/client";
import { updateSeeds, startTournament } from "@/app/(app)/_actions";

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface MatchPlayer {
  id: string;
  guest_name: string | null;
  users: { name: string } | null;
}

export interface Match {
  id: string;
  bracket: "winners" | "losers" | "grand_final";
  round: number;
  position: number;
  status: "pending" | "active" | "complete";
  winner_id: string | null;
  player1: MatchPlayer | null;
  player2: MatchPlayer | null;
  scoring_events: { player_id: string; points: number }[];
}

type Tab = "lobby" | "bracket" | "matches";

// ── Helpers ───────────────────────────────────────────────────────────────────

function playerName(p: MatchPlayer | null): string {
  if (!p) return "TBD";
  return p.users?.name ?? p.guest_name ?? "Unknown";
}

function matchScore(
  match: Match,
  playerId: string | undefined
): number {
  if (!playerId) return 0;
  return match.scoring_events
    .filter((e) => e.player_id === playerId)
    .reduce((sum, e) => sum + e.points, 0);
}

// ── Root component ─────────────────────────────────────────────────────────────

export default function TournamentDetail({
  tournament,
  players: initialPlayers,
  matches: initialMatches,
  isManager,
}: {
  tournament: Tournament;
  players: Player[];
  matches: Match[];
  isManager: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(
    tournament.status === "registration" ? "lobby" : "bracket"
  );
  const [copied, setCopied] = useState(false);

  // Realtime: refresh server data when players join
  useEffect(() => {
    if (tournament.status !== "registration") return;
    const supabase = createClient();
    const channel = supabase
      .channel(`lobby-${tournament.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tournament_players",
          filter: `tournament_id=eq.${tournament.id}`,
        },
        () => router.refresh()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tournament.id, tournament.status, router]);

  const joinUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/t/${tournament.join_code}`
      : `/t/${tournament.join_code}`;

  function copyLink() {
    navigator.clipboard.writeText(joinUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const statusConfig = {
    registration: {
      label: "OPEN",
      color: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      pulse: false,
    },
    active: {
      label: "LIVE",
      color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      pulse: true,
    },
    complete: {
      label: "FINAL",
      color: "bg-slate-700/50 text-slate-400 border-slate-600",
      pulse: false,
    },
  };
  const cfg = statusConfig[tournament.status];

  const completedMatches = initialMatches.filter((m) => m.status === "complete").length;
  const totalMatches = initialMatches.length;

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
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent 0, transparent 38px, rgba(255,255,255,0.025) 38px, rgba(255,255,255,0.025) 39px)",
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-[10px] font-bold tracking-[0.15em] px-2 py-0.5 rounded border ${cfg.color} flex items-center gap-1.5`}
              >
                {cfg.pulse && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />
                )}
                {cfg.label}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {tournament.join_code}
              </span>
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
        {tournament.status === "registration" && (
          <div className="flex items-stretch gap-2 mb-4">
            <div className="flex-1 flex items-center gap-2 bg-black/30 border border-white/5 rounded-lg px-3 py-2 min-w-0">
              <Share2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <span className="text-sm font-mono text-slate-300 truncate">
                /t/{tournament.join_code}
              </span>
            </div>
            <button
              onClick={copyLink}
              className={`px-4 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
                copied
                  ? "bg-emerald-500 text-white"
                  : "bg-red-600 hover:bg-red-500 text-white"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy
                </>
              )}
            </button>
          </div>
        )}

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <MiniStat
            value={`${initialPlayers.length}/${tournament.max_players}`}
            label="Players"
            icon={Users}
          />
          <MiniStat
            value={totalMatches > 0 ? `${completedMatches}/${totalMatches}` : "—"}
            label="Matches"
            icon={Activity}
          />
          <MiniStat value="DBL ELIM" label="Format" icon={Trophy} />
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-white/5">
        {(
          [
            { id: "lobby", label: "Lobby", icon: Users },
            { id: "bracket", label: "Bracket", icon: Shield },
            { id: "matches", label: "Matches", icon: Flame },
          ] as const
        ).map((item) => (
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
          players={initialPlayers}
          tournament={tournament}
          isManager={isManager}
        />
      )}
      {tab === "bracket" && (
        <BracketTab matches={initialMatches} status={tournament.status} />
      )}
      {tab === "matches" && <MatchesTab matches={initialMatches} />}
    </div>
  );
}

// ── Mini stat ─────────────────────────────────────────────────────────────────

function MiniStat({
  value,
  label,
  icon: Icon,
}: {
  value: string;
  label: string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-black/20 rounded-lg border border-white/5 px-3 py-3">
      <Icon className="w-3.5 h-3.5 text-slate-500 mx-auto mb-1.5" />
      <div className="font-display text-xl leading-none">{value}</div>
      <div className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mt-1">
        {label}
      </div>
    </div>
  );
}

// ── Lobby tab ─────────────────────────────────────────────────────────────────

function LobbyTab({
  players,
  tournament,
  isManager,
}: {
  players: Player[];
  tournament: Tournament;
  isManager: boolean;
}) {
  const router = useRouter();
  const [localPlayers, setLocalPlayers] = useState(players);
  const [startError, setStartError] = useState<string | null>(null);
  const [isStarting, startTransition] = useTransition();

  // Keep local list in sync when server data refreshes
  useEffect(() => { setLocalPlayers(players); }, [players]);

  const canDrag =
    isManager && tournament.status === "registration" && localPlayers.length > 1;
  const canStart =
    isManager && localPlayers.length >= 2 && tournament.status === "registration";

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localPlayers.findIndex((p) => p.id === active.id);
    const newIndex = localPlayers.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(localPlayers, oldIndex, newIndex);
    setLocalPlayers(reordered);
    await updateSeeds(
      tournament.id,
      reordered.map((p) => p.id)
    );
  }

  function handleStart() {
    setStartError(null);
    startTransition(async () => {
      const result = await startTournament(tournament.id);
      if (result?.error) {
        setStartError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  const playerList = (
    <div className="space-y-2 mb-5">
      {localPlayers.map((p, i) => {
        const displayName = p.users?.name ?? p.guest_name ?? "Unknown";
        const isGuest = !p.user_id;
        const seed = p.seed ?? i + 1;
        return (
          <div
            key={p.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/60 border border-white/5"
          >
            <GripVertical className="w-4 h-4 text-slate-700" />
            <SeedBadge seed={seed} />
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
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-lg tracking-wide text-slate-300">
          {localPlayers.length === 0 ? "WAITING FOR PLAYERS" : "PLAYERS"}
        </h3>
        <div className="flex items-center gap-2">
          {canDrag && (
            <span className="text-xs text-slate-500">Drag to reorder seeds</span>
          )}
          <span className="text-xs text-slate-500 font-mono">
            {localPlayers.length}/{tournament.max_players}
          </span>
        </div>
      </div>

      {localPlayers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 p-10 text-center mb-5">
          <Users className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm mb-1">No players yet</p>
          <p className="text-xs text-slate-600">
            Share the join link above to invite players
          </p>
        </div>
      ) : canDrag ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localPlayers.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2 mb-5">
              {localPlayers.map((p, i) => (
                <SortablePlayer key={p.id} player={p} seed={i + 1} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        playerList
      )}

      {startError && (
        <p className="text-red-400 text-sm mb-3 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
          {startError}
        </p>
      )}

      {isManager && tournament.status === "registration" && (
        <button
          disabled={!canStart || isStarting}
          onClick={handleStart}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-30 disabled:cursor-not-allowed font-display tracking-wider text-lg transition-all flex items-center justify-center gap-2"
        >
          {isStarting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Starting…
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              {localPlayers.length < 2 ? "NEED AT LEAST 2 PLAYERS" : "START TOURNAMENT"}
            </>
          )}
        </button>
      )}
    </div>
  );
}

function SortablePlayer({ player, seed }: { player: Player; seed: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const displayName = player.users?.name ?? player.guest_name ?? "Unknown";
  const isGuest = !player.user_id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/60 border border-white/5 hover:border-white/15 cursor-default"
    >
      <button
        {...listeners}
        {...attributes}
        className="touch-none cursor-grab active:cursor-grabbing p-0.5 -m-0.5 rounded text-slate-500 hover:text-slate-300"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <SeedBadge seed={seed} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{displayName}</span>
          {isGuest && (
            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
              Guest
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SeedBadge({ seed }: { seed: number }) {
  return (
    <div
      className={`w-8 h-8 rounded font-display text-lg flex items-center justify-center flex-shrink-0 ${
        seed === 1
          ? "bg-amber-500 text-slate-950"
          : seed <= 4
          ? "bg-red-600 text-white"
          : "bg-slate-800 text-slate-300"
      }`}
    >
      {seed}
    </div>
  );
}

// ── Bracket tab ───────────────────────────────────────────────────────────────

function BracketTab({
  matches,
  status,
}: {
  matches: Match[];
  status: Tournament["status"];
}) {
  if (matches.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 p-12 text-center">
        <Shield className="w-8 h-8 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">
          {status === "registration"
            ? "Bracket generates when the tournament starts."
            : "No matches yet."}
        </p>
      </div>
    );
  }

  const winners = matches.filter((m) => m.bracket === "winners");
  const losers = matches.filter((m) => m.bracket === "losers");
  const grandFinal = matches.filter((m) => m.bracket === "grand_final");

  const winnersRounds = groupByRound(winners);
  const losersRounds = groupByRound(losers);

  return (
    <div className="space-y-8">
      {/* Winners bracket */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-red-500" />
          <h3 className="font-display tracking-wide text-slate-300">
            WINNERS BRACKET
          </h3>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {winnersRounds.map((roundMatches, i) => (
            <RoundColumn
              key={i}
              label={`Round ${roundMatches[0].round}`}
              matches={roundMatches}
            />
          ))}
        </div>
      </div>

      {/* Losers bracket */}
      {losers.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-blue-500" />
            <h3 className="font-display tracking-wide text-slate-300">
              LOSERS BRACKET
            </h3>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {losersRounds.map((roundMatches, i) => (
              <RoundColumn
                key={i}
                label={`Round ${roundMatches[0].round}`}
                matches={roundMatches}
              />
            ))}
          </div>
        </div>
      )}

      {/* Grand Final */}
      {grandFinal.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-4 h-4 text-amber-400" />
            <h3 className="font-display tracking-wide text-slate-300">
              GRAND FINAL
            </h3>
          </div>
          <div className="max-w-xs">
            {grandFinal.map((m) => (
              <BracketMatchCard key={m.id} match={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function groupByRound(matches: Match[]): Match[][] {
  const map = new Map<number, Match[]>();
  for (const m of matches) {
    if (!map.has(m.round)) map.set(m.round, []);
    map.get(m.round)!.push(m);
  }
  return Array.from(map.values());
}

function RoundColumn({
  label,
  matches,
}: {
  label: string;
  matches: Match[];
}) {
  return (
    <div className="min-w-[180px] flex-shrink-0">
      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">
        {label}
      </div>
      <div className="space-y-2">
        {matches.map((m) => (
          <BracketMatchCard key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}

function BracketMatchCard({ match }: { match: Match }) {
  const p1Name = playerName(match.player1);
  const p2Name = playerName(match.player2);
  const p1Score = matchScore(match, match.player1?.id);
  const p2Score = matchScore(match, match.player2?.id);
  const isLive = match.status === "active";
  const isComplete = match.status === "complete";
  const p1Wins = match.winner_id === match.player1?.id;
  const p2Wins = match.winner_id === match.player2?.id;
  const isBye = !match.player1 || !match.player2;

  if (isBye && isComplete) {
    const winner = match.player1 ?? match.player2;
    return (
      <div className="rounded border border-white/10 overflow-hidden text-sm">
        <div className="px-2.5 py-1.5 bg-red-500/10 flex items-center justify-between">
          <span className="text-white font-semibold">{playerName(winner)}</span>
          <span className="text-[9px] text-slate-500 uppercase tracking-wider">BYE</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded border overflow-hidden text-sm ${
        isLive
          ? "border-emerald-500/40 shadow-lg shadow-emerald-500/10"
          : match.status === "pending"
          ? "border-blue-500/20"
          : "border-white/10"
      }`}
    >
      <div
        className={`px-2.5 py-1.5 flex items-center justify-between border-b border-white/5 ${
          p1Wins ? "bg-red-500/10" : ""
        }`}
      >
        <span
          className={
            p1Wins ? "text-white font-semibold" : "text-slate-300"
          }
        >
          {p1Name}
        </span>
        {(isLive || isComplete) && (
          <span
            className={`font-mono text-base ${
              p1Wins ? "text-red-400" : "text-slate-400"
            }`}
          >
            {p1Score}
          </span>
        )}
      </div>
      <div
        className={`px-2.5 py-1.5 flex items-center justify-between ${
          p2Wins ? "bg-red-500/10" : ""
        }`}
      >
        <span
          className={
            p2Wins ? "text-white font-semibold" : "text-slate-300"
          }
        >
          {p2Name}
        </span>
        {(isLive || isComplete) && (
          <span
            className={`font-mono text-base ${
              p2Wins ? "text-red-400" : "text-slate-400"
            }`}
          >
            {p2Score}
          </span>
        )}
      </div>
      {isLive && (
        <Link
          href={`/match/${match.id}`}
          className="bg-emerald-500/10 border-t border-emerald-500/30 px-2.5 py-1 flex items-center gap-1.5 hover:bg-emerald-500/20 transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot flex-shrink-0" />
          <span className="text-[10px] uppercase tracking-[0.15em] text-emerald-300 font-bold">
            Live
          </span>
        </Link>
      )}
    </div>
  );
}

// ── Matches tab ───────────────────────────────────────────────────────────────

function MatchesTab({ matches }: { matches: Match[] }) {
  if (matches.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-white/10 p-12 text-center">
        <Flame className="w-8 h-8 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">
          Matches will appear here once the tournament is active.
        </p>
      </div>
    );
  }

  const active = matches.filter((m) => m.status === "active");
  const pending = matches.filter((m) => m.status === "pending");
  const complete = matches.filter((m) => m.status === "complete");

  return (
    <div className="space-y-6">
      {active.length > 0 && (
        <section>
          <SectionHeading label="Live Now" />
          <div className="space-y-3">
            {active.map((m) => (
              <MatchRow key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}
      {pending.length > 0 && (
        <section>
          <SectionHeading label="Up Next" />
          <div className="space-y-3">
            {pending.map((m) => (
              <MatchRow key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}
      {complete.length > 0 && (
        <section>
          <SectionHeading label="Completed" />
          <div className="space-y-3">
            {complete.map((m) => (
              <MatchRow key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionHeading({ label }: { label: string }) {
  return (
    <h4 className="text-[10px] uppercase tracking-[0.25em] text-slate-500 mb-2">
      {label}
    </h4>
  );
}

function MatchRow({ match }: { match: Match }) {
  const p1Name = playerName(match.player1);
  const p2Name = playerName(match.player2);
  const p1Score = matchScore(match, match.player1?.id);
  const p2Score = matchScore(match, match.player2?.id);
  const isLive = match.status === "active";
  const isComplete = match.status === "complete";
  const p1Wins = match.winner_id === match.player1?.id;
  const p2Wins = match.winner_id === match.player2?.id;
  const p1Leading = p1Score > p2Score;

  const bracketLabel =
    match.bracket === "winners"
      ? `Winners R${match.round}`
      : match.bracket === "losers"
      ? `Losers R${match.round}`
      : "Grand Final";

  return (
    <div
      className={`rounded-lg border overflow-hidden ${
        isLive
          ? "border-emerald-500/40 bg-gradient-to-r from-emerald-500/5 to-transparent"
          : isComplete
          ? "border-white/5 bg-slate-900/60"
          : "border-white/10"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 text-xs">
        <span className="text-slate-400 font-mono">{bracketLabel}</span>
        {isLive ? (
          <span className="flex items-center gap-1.5 text-emerald-300 font-bold tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />
            LIVE NOW
          </span>
        ) : isComplete ? (
          <span className="text-slate-500">FINAL</span>
        ) : (
          <span className="text-slate-600">PENDING</span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-4">
        <div className="text-right">
          <div
            className={`font-display text-xl ${
              p1Wins || (isLive && p1Leading) ? "text-white" : "text-slate-400"
            }`}
          >
            {p1Name}
          </div>
        </div>
        <div className="flex items-center gap-3 px-4">
          <div
            className={`font-display text-4xl font-mono ${
              p1Leading ? "text-red-500" : "text-slate-500"
            }`}
          >
            {isLive || isComplete ? p1Score : "—"}
          </div>
          <div className="text-slate-700 font-display text-2xl">—</div>
          <div
            className={`font-display text-4xl font-mono ${
              !p1Leading && (isLive || isComplete) ? "text-blue-500" : "text-slate-500"
            }`}
          >
            {isLive || isComplete ? p2Score : "—"}
          </div>
        </div>
        <div className="text-left">
          <div
            className={`font-display text-xl ${
              p2Wins || (isLive && !p1Leading) ? "text-white" : "text-slate-400"
            }`}
          >
            {p2Name}
          </div>
        </div>
      </div>

      {isLive && (
        <Link
          href={`/match/${match.id}`}
          className="w-full py-2.5 bg-white/5 hover:bg-white/10 border-t border-white/5 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Eye className="w-4 h-4" /> Watch Live Scoring
        </Link>
      )}
    </div>
  );
}
