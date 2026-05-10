"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Users, Trophy, CheckCircle, Lock, LogIn, UserPlus } from "lucide-react";
import { joinAsUser, joinAsGuest } from "./_actions";

interface Tournament {
  id: string;
  name: string;
  status: "registration" | "active" | "complete";
  max_players: number;
  join_code: string;
}

interface Props {
  tournament: Tournament;
  playerCount: number;
  alreadyJoined: boolean;
  user: { id: string } | null;
  userName: string | null;
}

export default function JoinPage({
  tournament,
  playerCount,
  alreadyJoined,
  user,
  userName,
}: Props) {
  const [joined, setJoined] = useState(alreadyJoined);
  const [guestName, setGuestName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isFull = playerCount >= tournament.max_players;
  const isOpen = tournament.status === "registration";

  function handleJoinAsUser() {
    setError(null);
    startTransition(async () => {
      const result = await joinAsUser(tournament.id);
      if (result?.error && result.error !== "already_joined") {
        setError(result.error);
      } else {
        setJoined(true);
      }
    });
  }

  function handleJoinAsGuest() {
    if (!guestName.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await joinAsGuest(tournament.id, guestName.trim());
      if (result?.error) {
        setError(result.error);
      } else {
        setJoined(true);
      }
    });
  }

  return (
    <div className="min-h-full flex items-start justify-center px-4 pt-12 pb-20">
      <div className="w-full max-w-md">
        {/* Tournament card */}
        <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-white/10 p-6 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-slate-400">
              Tournament
            </span>
          </div>
          <h1 className="font-display text-4xl leading-none mb-4">
            {tournament.name}
          </h1>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Users className="w-4 h-4" />
              <span>
                {playerCount}/{tournament.max_players} players
              </span>
            </div>
            <StatusBadge status={tournament.status} />
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-500 transition-all"
              style={{ width: `${(playerCount / tournament.max_players) * 100}%` }}
            />
          </div>
        </div>

        {/* Action area */}
        {joined ? (
          <JoinedState name={userName ?? guestName} tournamentName={tournament.name} />
        ) : !isOpen ? (
          <ClosedState status={tournament.status} />
        ) : isFull ? (
          <FullState />
        ) : user ? (
          <UserJoinPanel
            userName={userName}
            isPending={isPending}
            error={error}
            onJoin={handleJoinAsUser}
          />
        ) : (
          <GuestJoinPanel
            guestName={guestName}
            setGuestName={setGuestName}
            isPending={isPending}
            error={error}
            onJoin={handleJoinAsGuest}
            joinCode={tournament.join_code}
          />
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Tournament["status"] }) {
  if (status === "registration")
    return (
      <span className="text-blue-300 text-xs font-medium flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        Open
      </span>
    );
  if (status === "active")
    return (
      <span className="text-emerald-300 text-xs font-medium flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />
        Live
      </span>
    );
  return (
    <span className="text-slate-500 text-xs">Finished</span>
  );
}

function JoinedState({ name, tournamentName }: { name: string; tournamentName: string }) {
  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
      <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
      <h2 className="font-display text-2xl mb-1">You&apos;re in!</h2>
      {name && (
        <p className="text-slate-400 text-sm mb-4">
          Joined as <span className="text-white font-medium">{name}</span>
        </p>
      )}
      <p className="text-slate-500 text-xs">
        The manager will start <span className="text-slate-300">{tournamentName}</span> when everyone is ready.
        Keep this page open or check back soon.
      </p>
    </div>
  );
}

function ClosedState({ status }: { status: Tournament["status"] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6 text-center">
      <Lock className="w-8 h-8 text-slate-600 mx-auto mb-3" />
      <h2 className="font-display text-xl mb-1 text-slate-300">
        {status === "active" ? "Tournament in progress" : "Tournament finished"}
      </h2>
      <p className="text-slate-500 text-sm">Registration is closed.</p>
    </div>
  );
}

function FullState() {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6 text-center">
      <Users className="w-8 h-8 text-slate-600 mx-auto mb-3" />
      <h2 className="font-display text-xl mb-1 text-slate-300">Tournament full</h2>
      <p className="text-slate-500 text-sm">All spots have been filled.</p>
    </div>
  );
}

function UserJoinPanel({
  userName,
  isPending,
  error,
  onJoin,
}: {
  userName: string | null;
  isPending: boolean;
  error: string | null;
  onJoin: () => void;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6">
      <h2 className="font-display text-xl mb-1">Join tournament</h2>
      <p className="text-slate-400 text-sm mb-5">
        Joining as{" "}
        <span className="text-white font-medium">{userName ?? "your account"}</span>
      </p>
      {error && (
        <p className="text-red-400 text-sm mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
          {error}
        </p>
      )}
      <button
        onClick={onJoin}
        disabled={isPending}
        className="w-full py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 font-display tracking-wider text-lg transition-all flex items-center justify-center gap-2"
      >
        <UserPlus className="w-5 h-5" />
        {isPending ? "Joining…" : "Join Now"}
      </button>
    </div>
  );
}

function GuestJoinPanel({
  guestName,
  setGuestName,
  isPending,
  error,
  onJoin,
  joinCode,
}: {
  guestName: string;
  setGuestName: (v: string) => void;
  isPending: boolean;
  error: string | null;
  onJoin: () => void;
  joinCode: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-6">
      <h2 className="font-display text-xl mb-1">Join as guest</h2>
      <p className="text-slate-400 text-sm mb-5">Enter your name to join the tournament.</p>

      {error && (
        <p className="text-red-400 text-sm mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
          {error}
        </p>
      )}

      <input
        type="text"
        value={guestName}
        onChange={(e) => setGuestName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onJoin()}
        placeholder="Your name"
        maxLength={30}
        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 mb-3"
      />
      <button
        onClick={onJoin}
        disabled={isPending || !guestName.trim()}
        className="w-full py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 font-display tracking-wider text-lg transition-all flex items-center justify-center gap-2 mb-5"
      >
        <UserPlus className="w-5 h-5" />
        {isPending ? "Joining…" : "Join Now"}
      </button>

      <div className="border-t border-white/5 pt-4">
        <p className="text-xs text-slate-500 text-center">
          Have an account?{" "}
          <Link
            href={`/login?next=/t/${joinCode}`}
            className="text-blue-400 hover:text-blue-300"
          >
            Sign in
          </Link>{" "}
          to join with your profile.
        </p>
      </div>
    </div>
  );
}
