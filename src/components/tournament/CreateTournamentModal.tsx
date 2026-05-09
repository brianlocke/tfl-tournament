"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Trophy } from "lucide-react";
import { createTournament } from "@/app/(app)/_actions";

const SIZES = [4, 8, 16, 32] as const;

export default function CreateTournamentModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [size, setSize] = useState<4 | 8 | 16 | 32>(8);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setPending(true);
    setError(null);
    const result = await createTournament(name.trim(), size);
    if ("error" in result) {
      setError(result.error);
      setPending(false);
    } else {
      router.push(`/manage/${result.id}`);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-tfl-navy border border-white/10 rounded-t-2xl sm:rounded-2xl w-full max-w-md overflow-hidden"
      >
        <div className="bg-gradient-to-r from-red-600/30 to-transparent border-b border-white/5 p-5 flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-red-400 mb-1">New Tournament</div>
            <h2 className="font-display text-3xl tracking-wide leading-none">CREATE BRACKET</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center mt-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="text-xs uppercase tracking-[0.15em] text-slate-400 mb-2 block">
              Tournament Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Saturday Showdown"
              autoFocus
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:border-red-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.15em] text-slate-400 mb-2 block">
              Player Count
            </label>
            <div className="grid grid-cols-4 gap-2">
              {SIZES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSize(n)}
                  className={`py-3 rounded-lg font-display text-2xl tracking-wide border-2 transition-all ${
                    size === n
                      ? "bg-red-600 border-red-500 text-white"
                      : "bg-black/30 border-white/5 text-slate-400 hover:border-white/20"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3 flex items-start gap-3">
            <Trophy className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300 leading-relaxed">
              Format is <span className="text-blue-300 font-semibold">Double Elimination</span>. Players need two losses to be eliminated.
            </p>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg border border-white/10 hover:bg-white/5 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || pending}
              className="flex-1 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-40 disabled:cursor-not-allowed font-display tracking-wider transition-all"
            >
              {pending ? "CREATING…" : "CREATE"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
