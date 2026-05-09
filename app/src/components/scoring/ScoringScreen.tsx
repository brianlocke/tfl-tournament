"use client";

import { useState, useEffect } from "react";
import {
  Undo2, X, Trophy, Zap, Shield, Flame,
  AlertTriangle, ChevronUp, Activity, QrCode,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Player = "p1" | "p2";
type Team = "red" | "blue";
type CardColor = "blue" | "red" | "green";

type CardKey =
  | "super_td" | "super_fg" | "extra_points" | "fg_card"
  | "pick_six" | "block_fg" | "bomb_pass" | "sack";

type EventType =
  | "touchdown" | "super_touchdown"
  | "extra_point" | "extra_points_card"
  | "field_goal" | "super_field_goal"
  | "negate_touchdown" | "negate_field_goal";

interface CardDef {
  name: string;
  type: string;
  color: CardColor;
  desc: string;
  armable?: boolean;
  interrupt?: "td" | "fg";
  positional?: boolean;
}

interface ScoringEvent {
  id: string;
  player: Player;
  type: EventType;
  points: number;
  card: string | null;
  negated: boolean;
  ts: number;
}

interface InterruptState {
  defender: Player;
  eventId: string;
  eventType: "td" | "fg";
  expiresAt: number;
}

interface UndoState {
  eventId: string;
  expiresAt: number;
}

export interface MatchConfig {
  tournamentName: string;
  round: string;
  p1Name: string;
  p2Name: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CARD_DEFS: Record<CardKey, CardDef> = {
  super_td:     { name: "Super Touchdown", type: "OFFENSE",       color: "blue",  desc: "Next TD scores 10",       armable: true },
  super_fg:     { name: "Super Field Goal", type: "OFFENSE",      color: "blue",  desc: "Next FG scores 10",       armable: true },
  extra_points: { name: "Extra Points",    type: "OFFENSE",       color: "blue",  desc: "Next XP scores 3",        armable: true },
  fg_card:      { name: "Field Goal",      type: "OFFENSE",       color: "blue",  desc: "FG attempt anywhere",     armable: true },
  pick_six:     { name: "Pick Six",        type: "DEFENSE",       color: "red",   desc: "Negate opp TD",           interrupt: "td" },
  block_fg:     { name: "Blocked FG",      type: "SPECIAL TEAMS", color: "green", desc: "Negate opp FG",           interrupt: "fg" },
  bomb_pass:    { name: "Bomb Pass",       type: "OFFENSE",       color: "blue",  desc: "Move to opp 30",          positional: true },
  sack:         { name: "Sack",            type: "DEFENSE",       color: "red",   desc: "Push opp to own 1",       positional: true },
};

const PICKER_CARDS: CardKey[] = [
  "super_td", "super_fg", "extra_points", "fg_card", "pick_six", "block_fg",
];

const WIN_THRESHOLD = 30;
const INTERRUPT_WINDOW_MS = 10_000;
const UNDO_WINDOW_MS = 10_000;

// ─── Root component ───────────────────────────────────────────────────────────

export default function ScoringScreen({ config }: { config: MatchConfig }) {
  const [scores, setScores] = useState<Record<Player, number>>({ p1: 0, p2: 0 });
  const [armed, setArmed] = useState<Record<Player, CardKey | null>>({ p1: null, p2: null });
  const [hands, setHands] = useState<Record<Player, CardKey[]>>({ p1: [], p2: [] });
  const [usedCards, setUsedCards] = useState<Record<Player, CardKey[]>>({ p1: [], p2: [] });
  const [events, setEvents] = useState<ScoringEvent[]>([]);
  const [interrupt, setInterrupt] = useState<InterruptState | null>(null);
  const [undoable, setUndoable] = useState<UndoState | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [picker, setPicker] = useState<{ player: Player } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (interrupt && now > interrupt.expiresAt) setInterrupt(null);
    if (undoable && now > undoable.expiresAt) setUndoable(null);
  }, [now, interrupt, undoable]);

  const opponent = (p: Player): Player => (p === "p1" ? "p2" : "p1");

  function recordEvent(player: Player, type: EventType, points: number, card: string | null = null) {
    const id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const evt: ScoringEvent = { id, player, type, points, card, negated: false, ts: Date.now() };
    setEvents((e) => [evt, ...e].slice(0, 50));
    setScores((s) => ({ ...s, [player]: s[player] + points }));
    setUndoable({ eventId: id, expiresAt: Date.now() + UNDO_WINDOW_MS });

    if (type === "touchdown" || type === "super_touchdown") {
      if (hands[opponent(player)].includes("pick_six")) {
        setInterrupt({ defender: opponent(player), eventId: id, eventType: "td", expiresAt: Date.now() + INTERRUPT_WINDOW_MS });
      }
    } else if (type === "field_goal" || type === "super_field_goal") {
      if (hands[opponent(player)].includes("block_fg")) {
        setInterrupt({ defender: opponent(player), eventId: id, eventType: "fg", expiresAt: Date.now() + INTERRUPT_WINDOW_MS });
      }
    }
    return evt;
  }

  function consumeArmed(player: Player) {
    const cardKey = armed[player];
    if (!cardKey) return;
    setArmed((a) => ({ ...a, [player]: null }));
    setHands((h) => ({ ...h, [player]: h[player].filter((c) => c !== cardKey) }));
    setUsedCards((u) => ({ ...u, [player]: [...u[player], cardKey] }));
  }

  function score(player: Player, baseType: "touchdown" | "extra_point" | "field_goal") {
    if (winner) return;
    const mod = armed[player];
    let type: EventType = baseType;
    let points = baseType === "touchdown" ? 6 : baseType === "field_goal" ? 3 : 1;
    let cardLabel: string | null = null;

    if (baseType === "touchdown" && mod === "super_td") {
      type = "super_touchdown"; points = 10; cardLabel = CARD_DEFS.super_td.name; consumeArmed(player);
    } else if (baseType === "field_goal" && mod === "super_fg") {
      type = "super_field_goal"; points = 10; cardLabel = CARD_DEFS.super_fg.name; consumeArmed(player);
    } else if (baseType === "extra_point" && mod === "extra_points") {
      type = "extra_points_card"; points = 3; cardLabel = CARD_DEFS.extra_points.name; consumeArmed(player);
    } else if (baseType === "field_goal" && mod === "fg_card") {
      cardLabel = CARD_DEFS.fg_card.name; consumeArmed(player);
    }

    recordEvent(player, type, points, cardLabel);
    setTimeout(() => {
      setScores((s) => {
        if (s[player] > WIN_THRESHOLD && !winner) setWinner(player);
        return s;
      });
    }, 50);
  }

  function tapCard(player: Player, cardKey: CardKey) {
    if (winner) return;
    const card = CARD_DEFS[cardKey];
    if (!card.armable) return;
    setArmed((a) => ({ ...a, [player]: a[player] === cardKey ? null : cardKey }));
  }

  function undo() {
    if (!undoable) return;
    const ev = events.find((e) => e.id === undoable.eventId);
    if (!ev) return;
    setEvents((es) => es.filter((e) => e.id !== ev.id));
    setScores((s) => ({ ...s, [ev.player]: Math.max(0, s[ev.player] - ev.points) }));
    setUndoable(null);
    if (interrupt?.eventId === ev.id) setInterrupt(null);
  }

  function activateInterrupt() {
    if (!interrupt) return;
    const target = events.find((e) => e.id === interrupt.eventId);
    if (!target) return;
    setEvents((es) => es.map((e) => (e.id === target.id ? { ...e, negated: true } : e)));
    setScores((s) => ({ ...s, [target.player]: Math.max(0, s[target.player] - target.points) }));
    const cardKey: CardKey = interrupt.eventType === "td" ? "pick_six" : "block_fg";
    setEvents((es) => [{
      id: `evt_${Date.now()}`,
      player: interrupt.defender,
      type: interrupt.eventType === "td" ? "negate_touchdown" : "negate_field_goal",
      points: 0,
      card: CARD_DEFS[cardKey].name,
      negated: false,
      ts: Date.now(),
    }, ...es]);
    setHands((h) => ({ ...h, [interrupt.defender]: h[interrupt.defender].filter((c) => c !== cardKey) }));
    setUsedCards((u) => ({ ...u, [interrupt.defender]: [...u[interrupt.defender], cardKey] }));
    setInterrupt(null);
    setUndoable(null);
  }

  function removeCard(player: Player, slotIndex: number) {
    if (winner) return;
    const removedKey = hands[player][slotIndex];
    setHands((h) => ({ ...h, [player]: h[player].filter((_, i) => i !== slotIndex) }));
    if (armed[player] === removedKey) setArmed((a) => ({ ...a, [player]: null }));
  }

  function reset() {
    setScores({ p1: 0, p2: 0 });
    setArmed({ p1: null, p2: null });
    setHands({ p1: [], p2: [] });
    setUsedCards({ p1: [], p2: [] });
    setEvents([]);
    setInterrupt(null);
    setUndoable(null);
    setWinner(null);
    setPicker(null);
  }

  const lastEventByPlayer = (p: Player) => events.find((e) => e.player === p && !e.negated);
  const undoSeconds = undoable ? Math.max(0, Math.ceil((undoable.expiresAt - now) / 1000)) : 0;
  const interruptSeconds = interrupt ? Math.max(0, Math.ceil((interrupt.expiresAt - now) / 1000)) : 0;
  const playerName = (p: Player) => (p === "p1" ? config.p1Name : config.p2Name);

  const justScoredTD = (p: Player) => {
    const last = lastEventByPlayer(p);
    return !!last &&
      (last.type === "touchdown" || last.type === "super_touchdown") &&
      now - last.ts < 30_000;
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Header */}
      <header className="px-4 py-2.5 border-b border-white/10 bg-black flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded bg-brand-red flex items-center justify-center flex-shrink-0">
            <span className="font-display text-sm">T</span>
          </div>
          <div className="min-w-0">
            <div className="text-xs font-display tracking-wider truncate">
              {config.tournamentName} · {config.round}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />
              <span className="text-[10px] text-emerald-300 font-bold tracking-wider">LIVE · SYNCED</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {undoable && (
            <button onClick={undo} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30">
              <Undo2 className="w-3 h-3" /> UNDO {undoSeconds}s
            </button>
          )}
          <button onClick={() => setShowLog(!showLog)} className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </button>
          <button onClick={reset} className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* P2 — top, rotated for opposite-side viewing */}
      <PlayerPanel
        player="p2" team="blue" name={config.p2Name}
        score={scores.p2} armed={armed.p2} hand={hands.p2}
        justScoredTD={justScoredTD("p2")}
        onScore={score} onTapCard={tapCard}
        onDraw={() => { if (!winner && hands.p2.length < 3) setPicker({ player: "p2" }); }}
        onRemoveCard={(i) => removeCard("p2", i)}
        interrupt={interrupt?.defender === "p2" ? interrupt : null}
        interruptSeconds={interruptSeconds}
        onActivateInterrupt={activateInterrupt}
        winner={winner} flipped
      />

      {/* Progress bars */}
      <div className="bg-black px-4 py-2.5 border-y border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-white/5 rounded-full relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-700 to-red-500 transition-all"
              style={{ width: `${Math.min(100, (scores.p1 / WIN_THRESHOLD) * 100)}%` }} />
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-white/30 flex-shrink-0" />
          <div className="flex-1 h-2 bg-white/5 rounded-full relative overflow-hidden">
            <div className="absolute inset-y-0 right-0 bg-gradient-to-l from-blue-700 to-blue-500 transition-all"
              style={{ width: `${Math.min(100, (scores.p2 / WIN_THRESHOLD) * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* P1 — bottom, natural phone-hold */}
      <PlayerPanel
        player="p1" team="red" name={config.p1Name}
        score={scores.p1} armed={armed.p1} hand={hands.p1}
        justScoredTD={justScoredTD("p1")}
        onScore={score} onTapCard={tapCard}
        onDraw={() => { if (!winner && hands.p1.length < 3) setPicker({ player: "p1" }); }}
        onRemoveCard={(i) => removeCard("p1", i)}
        interrupt={interrupt?.defender === "p1" ? interrupt : null}
        interruptSeconds={interruptSeconds}
        onActivateInterrupt={activateInterrupt}
        winner={winner}
      />

      {showLog && <EventLog events={events} playerName={playerName} onClose={() => setShowLog(false)} />}
      {picker && <CardPicker player={picker.player} name={playerName(picker.player)} onPick={(k) => { setHands((h) => ({ ...h, [picker.player]: [...h[picker.player], k] })); setPicker(null); }} onCancel={() => setPicker(null)} />}
      {winner && <WinModal winner={winner} name={playerName(winner)} team={winner === "p1" ? "red" : "blue"} score={scores[winner]} oppScore={scores[opponent(winner)]} onConfirm={reset} />}
    </div>
  );
}

// ─── Player Panel ─────────────────────────────────────────────────────────────

const TEAM_COLORS = {
  red: {
    bg: "from-red-950/60 to-black",
    led: "led-red",
    border: "border-red-900/40",
    btnPrimary: "bg-red-600 hover:bg-red-500 active:bg-red-700 border-red-500",
    btnGhost: "bg-red-950/50 hover:bg-red-900/50 border-red-900/60",
    accent: "text-red-400",
    drawBorder: "border-red-500/40 hover:border-red-400 hover:bg-red-950/40",
  },
  blue: {
    bg: "from-blue-950/60 to-black",
    led: "led-blue",
    border: "border-blue-900/40",
    btnPrimary: "bg-blue-600 hover:bg-blue-500 active:bg-blue-700 border-blue-500",
    btnGhost: "bg-blue-950/50 hover:bg-blue-900/50 border-blue-900/60",
    accent: "text-blue-400",
    drawBorder: "border-blue-500/40 hover:border-blue-400 hover:bg-blue-950/40",
  },
};

function PlayerPanel({
  player, team, name, score, armed, hand, justScoredTD,
  onScore, onTapCard, onDraw, onRemoveCard,
  interrupt, interruptSeconds, onActivateInterrupt, winner, flipped = false,
}: {
  player: Player; team: Team; name: string; score: number;
  armed: CardKey | null; hand: CardKey[]; justScoredTD: boolean;
  onScore: (p: Player, t: "touchdown" | "extra_point" | "field_goal") => void;
  onTapCard: (p: Player, k: CardKey) => void;
  onDraw: () => void; onRemoveCard: (i: number) => void;
  interrupt: InterruptState | null; interruptSeconds: number;
  onActivateInterrupt: () => void; winner: Player | null; flipped?: boolean;
}) {
  const c = TEAM_COLORS[team];
  const isLoser = winner && winner !== player;

  const tdLabel = armed === "super_td" ? "SUPER TD" : "TD";
  const tdPoints = armed === "super_td" ? 10 : 6;
  const fgLabel = armed === "super_fg" ? "SUPER FG" : "FG";
  const fgPoints = armed === "super_fg" ? 10 : 3;
  const xpLabel = armed === "extra_points" ? "EXTRA PTS" : "XP";
  const xpPoints = armed === "extra_points" ? 3 : 1;

  return (
    <section className={`relative flex-1 bg-gradient-to-b ${c.bg} field-bg px-4 py-4 ${isLoser ? "opacity-50" : ""} ${flipped ? "rotate-180" : ""}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className={`text-[10px] font-bold tracking-[0.2em] ${c.accent} mb-0.5`}>{team.toUpperCase()} TEAM</div>
          <div className="font-display text-2xl tracking-wide truncate">{name}</div>
        </div>
        <div className="text-right">
          <div key={score} className={`font-scoreboard font-black text-7xl leading-none ${c.led} score-pop tabular-nums`}>
            {score.toString().padStart(2, "0")}
          </div>
          {winner === player && (
            <div className="flex items-center justify-end gap-1 mt-1 text-amber-400">
              <Trophy className="w-3 h-3" />
              <span className="text-[10px] font-bold tracking-wider">WINNER</span>
            </div>
          )}
        </div>
      </div>

      {interrupt && (
        <button onClick={onActivateInterrupt}
          className="w-full mb-2.5 rounded-lg bg-gradient-to-r from-red-600 to-red-700 border-2 border-red-400 px-3 py-2.5 flex items-center justify-between interrupt-pulse slide-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <div className="text-left">
              <div className="font-display text-sm tracking-wider">{interrupt.eventType === "td" ? "PICK SIX!" : "BLOCK FG!"}</div>
              <div className="text-[10px] opacity-80">Negate opponent&apos;s {interrupt.eventType === "td" ? "TD" : "FG"}</div>
            </div>
          </div>
          <div className="font-scoreboard text-xs bg-black/40 px-2 py-1 rounded">{interruptSeconds}s</div>
        </button>
      )}

      <div className="grid grid-cols-3 gap-2 mb-3">
        <ScoreButton label={tdLabel} points={tdPoints} armed={armed === "super_td"} color={c.btnPrimary} onClick={() => onScore(player, "touchdown")} disabled={!!winner} />
        <ScoreButton label={xpLabel} points={xpPoints} armed={armed === "extra_points"} color={justScoredTD ? c.btnGhost : "bg-white/5 border-white/10"} onClick={() => onScore(player, "extra_point")} disabled={!justScoredTD || !!winner} subtle={!justScoredTD} />
        <ScoreButton label={fgLabel} points={fgPoints} armed={armed === "super_fg" || armed === "fg_card"} color={c.btnPrimary} onClick={() => onScore(player, "field_goal")} disabled={!!winner} />
      </div>

      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Action Cards · {hand.length}/3</span>
        {armed && <span className="text-[10px] uppercase tracking-[0.15em] text-amber-400 font-bold">⚡ ARMED</span>}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {hand.map((cardKey, i) => (
          <ActionCard key={`${cardKey}-${i}`} cardKey={cardKey} armed={armed === cardKey} onTap={() => onTapCard(player, cardKey)} onRemove={() => onRemoveCard(i)} disabled={!!winner} />
        ))}
        {Array.from({ length: 3 - hand.length }).map((_, i) => (
          <button key={`draw-${i}`} onClick={onDraw} disabled={!!winner}
            className={`aspect-[4/5] rounded border-2 border-dashed ${c.drawBorder} flex flex-col items-center justify-center transition-all active:scale-95 disabled:opacity-30`}>
            <ChevronUp className="w-4 h-4 text-slate-400 mb-0.5" />
            <span className="font-display text-[11px] tracking-wider text-slate-300">DRAW</span>
          </button>
        ))}
      </div>
    </section>
  );
}

// ─── Score Button ─────────────────────────────────────────────────────────────

function ScoreButton({ label, points, armed, color, onClick, disabled, subtle }: {
  label: string; points: number; armed: boolean; color: string;
  onClick: () => void; disabled: boolean; subtle?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`relative rounded-lg border-2 ${color} py-3 px-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] ${armed ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-black" : ""}`}>
      <div className={`font-display text-base tracking-wider leading-none ${subtle ? "text-slate-500" : ""}`}>{label}</div>
      <div className={`font-scoreboard font-black text-xl mt-0.5 ${armed ? "text-amber-300" : subtle ? "text-slate-600" : ""}`}>+{points}</div>
    </button>
  );
}

// ─── Action Card ──────────────────────────────────────────────────────────────

const CARD_COLORS: Record<CardColor, { bg: string; border: string; tag: string }> = {
  blue:  { bg: "bg-gradient-to-b from-blue-700 to-blue-900",    border: "border-blue-400",    tag: "bg-blue-500/30 text-blue-200" },
  red:   { bg: "bg-gradient-to-b from-red-700 to-red-900",      border: "border-red-400",     tag: "bg-red-500/30 text-red-200" },
  green: { bg: "bg-gradient-to-b from-emerald-700 to-emerald-900", border: "border-emerald-400", tag: "bg-emerald-500/30 text-emerald-200" },
};

function ActionCard({ cardKey, armed, onTap, onRemove, disabled }: {
  cardKey: CardKey; armed: boolean; onTap: () => void; onRemove: () => void; disabled: boolean;
}) {
  const card = CARD_DEFS[cardKey];
  const c = CARD_COLORS[card.color];
  const Icon = card.color === "red" ? Shield : card.color === "green" ? Zap : Flame;

  return (
    <div className="relative">
      <button onClick={onTap} disabled={disabled || (!card.armable && !card.interrupt)}
        className={`w-full aspect-[4/5] rounded ${c.bg} border ${c.border} overflow-hidden text-left transition-all active:scale-95 disabled:opacity-40 ${armed ? "glow-armed scale-[1.04]" : ""} ${!card.armable ? "opacity-70" : ""}`}>
        <div className={`text-[8px] font-bold tracking-[0.15em] px-1.5 py-0.5 ${c.tag} flex items-center gap-1`}>
          <Icon className="w-2 h-2" /> {card.type}
        </div>
        <div className="px-1.5 pt-1">
          <div className="font-display text-[11px] leading-tight">{card.name}</div>
          <div className="text-[8px] text-white/60 mt-0.5 leading-tight">{card.desc}</div>
        </div>
        {!card.armable && !card.interrupt && (
          <div className="absolute bottom-0.5 right-1 text-[7px] text-white/40 italic">physical</div>
        )}
      </button>
      {!disabled && (
        <button onClick={onRemove} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black border border-white/20 flex items-center justify-center hover:bg-red-900">
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
}

// ─── Event Log ────────────────────────────────────────────────────────────────

const EVENT_LABELS: Partial<Record<EventType, string>> = {
  touchdown: "Touchdown",
  super_touchdown: "Super Touchdown",
  extra_point: "Extra Point",
  extra_points_card: "Extra Points (card)",
  field_goal: "Field Goal",
  super_field_goal: "Super Field Goal",
  negate_touchdown: "PICK SIX — negated TD",
  negate_field_goal: "BLOCK FG — negated FG",
};

function EventLog({ events, playerName, onClose }: {
  events: ScoringEvent[];
  playerName: (p: Player) => string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-end slide-in" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full bg-tfl-navy border-t border-white/10 rounded-t-2xl max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="font-display text-lg tracking-wide">EVENT LOG</h3>
          <button onClick={onClose} className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center">
            <ChevronUp className="w-4 h-4 rotate-180" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {events.length === 0 && <div className="text-center text-slate-500 py-8 text-sm">No scoring events yet</div>}
          {events.map((e) => (
            <div key={e.id} className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${e.negated ? "opacity-40 line-through" : ""} ${e.player === "p1" ? "bg-red-950/30" : "bg-blue-950/30"}`}>
              <span className={`w-2 h-2 rounded-full ${e.player === "p1" ? "bg-red-500" : "bg-blue-500"}`} />
              <span className={`font-bold ${e.player === "p1" ? "text-red-300" : "text-blue-300"}`}>{playerName(e.player)}</span>
              <span className="flex-1 truncate">{EVENT_LABELS[e.type] ?? e.type}</span>
              {e.card && <span className="text-[10px] uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">{e.card}</span>}
              <span className="font-scoreboard font-bold w-10 text-right">{e.points > 0 ? "+" : ""}{e.points}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Card Picker ──────────────────────────────────────────────────────────────

function CardPicker({ player, name, onPick, onCancel }: {
  player: Player; name: string;
  onPick: (k: CardKey) => void; onCancel: () => void;
}) {
  const team: Team = player === "p1" ? "red" : "blue";
  const c = TEAM_COLORS[team];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 slide-in" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md bg-gradient-to-br ${c.bg} border-t sm:border border-white/10 rounded-t-2xl sm:rounded-2xl overflow-hidden ${team === "blue" ? "rotate-180" : ""}`}>
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <div className={`text-[10px] uppercase tracking-[0.3em] ${c.accent} mb-0.5`}>{name} · DRAW</div>
            <div className="font-display text-2xl tracking-wide leading-none">WHICH CARD?</div>
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-2.5 bg-black/30 border-b border-white/5 text-xs text-slate-400">
          Tap the card you just drew. Non-scoring cards (Bomb Pass, Sack, etc.) — leave the slot empty.
        </div>
        <div className="grid grid-cols-2 gap-2 p-3">
          {PICKER_CARDS.map((cardKey) => {
            const card = CARD_DEFS[cardKey];
            const cc = CARD_COLORS[card.color];
            const Icon = card.color === "red" ? Shield : card.color === "green" ? Zap : Flame;
            return (
              <button key={cardKey} onClick={() => onPick(cardKey)}
                className={`text-left rounded-lg ${cc.bg} border-2 ${cc.border} overflow-hidden p-3 transition-all active:scale-[0.97] hover:brightness-110`}>
                <div className={`text-[9px] font-bold tracking-[0.15em] inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${cc.tag} mb-2`}>
                  <Icon className="w-2.5 h-2.5" /> {card.type}
                </div>
                <div className="font-display text-base leading-tight mb-1">{card.name}</div>
                <div className="text-[11px] text-white/70 leading-tight">{card.desc}</div>
              </button>
            );
          })}
        </div>
        <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <QrCode className="w-3.5 h-3.5" /> <span>v2: scan QR on card back</span>
          </div>
          <button onClick={onCancel} className="text-xs text-slate-400 hover:text-white px-2 py-1">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Win Modal ────────────────────────────────────────────────────────────────

function WinModal({ winner, name, team, score, oppScore, onConfirm }: {
  winner: Player; name: string; team: Team; score: number; oppScore: number; onConfirm: () => void;
}) {
  const accent = team === "red" ? "led-red" : "led-blue";
  const bg = team === "red" ? "from-red-950" : "from-blue-950";

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
      <div className={`w-full max-w-sm bg-gradient-to-br ${bg} to-black border border-white/10 rounded-2xl p-6 text-center slide-in`}>
        <Trophy className="w-12 h-12 text-tfl-gold mx-auto mb-3" />
        <div className="text-xs uppercase tracking-[0.3em] text-tfl-gold mb-1">Match Complete</div>
        <div className="font-display text-4xl tracking-wide mb-1">{name}</div>
        <div className="text-sm text-slate-400 mb-5">wins the match</div>
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className={`font-scoreboard font-black text-5xl ${accent}`}>{score}</div>
          <div className="font-display text-2xl text-slate-600">—</div>
          <div className="font-scoreboard font-black text-5xl text-slate-500">{oppScore}</div>
        </div>
        <button onClick={onConfirm}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 font-display tracking-wider text-black transition-all">
          CONFIRM &amp; ADVANCE BRACKET
        </button>
        <button onClick={onConfirm} className="w-full mt-2 py-2 text-xs text-slate-500 hover:text-slate-300">Reset (demo)</button>
      </div>
    </div>
  );
}
