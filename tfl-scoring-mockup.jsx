import { useState, useEffect, useRef } from "react";
import {
  Undo2,
  X,
  Trophy,
  Zap,
  Shield,
  Flame,
  AlertTriangle,
  ChevronUp,
  Activity,
  QrCode,
} from "lucide-react";

// ===== CARD DATA =====
// Only cards that affect the scoring app's UI logic are interactive.
// Others (Bomb Pass, Sack, etc.) are positional — players resolve on the table.

const CARD_DEFS = {
  super_td: {
    name: "Super Touchdown",
    type: "OFFENSE",
    color: "blue",
    desc: "Next TD scores 10",
    armable: true,
  },
  super_fg: {
    name: "Super Field Goal",
    type: "OFFENSE",
    color: "blue",
    desc: "Next FG scores 10",
    armable: true,
  },
  extra_points: {
    name: "Extra Points",
    type: "OFFENSE",
    color: "blue",
    desc: "Next XP scores 3",
    armable: true,
    requiresJustScoredTD: true,
  },
  fg_card: {
    name: "Field Goal",
    type: "OFFENSE",
    color: "blue",
    desc: "FG attempt anywhere",
    armable: true,
  },
  pick_six: {
    name: "Pick Six",
    type: "DEFENSE",
    color: "red",
    desc: "Negate opp TD",
    interrupt: "td",
  },
  block_fg: {
    name: "Blocked FG",
    type: "SPECIAL TEAMS",
    color: "green",
    desc: "Negate opp FG",
    interrupt: "fg",
  },
  bomb_pass: {
    name: "Bomb Pass",
    type: "OFFENSE",
    color: "blue",
    desc: "Move to opp 30",
    positional: true,
  },
  sack: {
    name: "Sack",
    type: "DEFENSE",
    color: "red",
    desc: "Push opp to own 1",
    positional: true,
  },
};

const INITIAL_HANDS = {
  p1: [],
  p2: [],
};

// The 6 scoring-relevant cards a player can draw (v1: tap-to-select).
// Positional cards (Bomb Pass, Sack, etc.) are resolved physically and
// don't enter the app — see /tfl-docs/10-card-tracking.md.
const PICKER_CARDS = [
  "super_td",
  "super_fg",
  "extra_points",
  "fg_card",
  "pick_six",
  "block_fg",
];

const WIN_THRESHOLD = 30;
const INTERRUPT_WINDOW_MS = 10_000;
const UNDO_WINDOW_MS = 10_000;

// ===== APP =====
export default function App() {
  return (
    <div
      className="min-h-screen bg-black text-white"
      style={{ fontFamily: "Saira, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Saira:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700;900&display=swap');
        .font-display { font-family: 'Anton', sans-serif; letter-spacing: 0.03em; }
        .font-body { font-family: 'Saira', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .led-red { color: #ff2a2a; text-shadow: 0 0 24px rgba(255,42,42,0.5), 0 0 4px rgba(255,42,42,0.8); }
        .led-blue { color: #2a8aff; text-shadow: 0 0 24px rgba(42,138,255,0.5), 0 0 4px rgba(42,138,255,0.8); }
        @keyframes pulse-dot { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }
        .live-dot { animation: pulse-dot 1.4s ease-in-out infinite; }
        @keyframes glow-armed {
          0%,100% { box-shadow: 0 0 0 2px rgba(251,191,36,0.8), 0 0 24px rgba(251,191,36,0.5); }
          50% { box-shadow: 0 0 0 2px rgba(251,191,36,1), 0 0 32px rgba(251,191,36,0.8); }
        }
        .glow-armed { animation: glow-armed 1.6s ease-in-out infinite; }
        @keyframes interrupt-pulse {
          0%,100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239,68,68,0.6); }
          50% { transform: scale(1.04); box-shadow: 0 0 0 12px rgba(239,68,68,0); }
        }
        .interrupt-pulse { animation: interrupt-pulse 1.2s ease-in-out infinite; }
        @keyframes score-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.12); }
          100% { transform: scale(1); }
        }
        .score-pop { animation: score-pop 0.4s ease-out; }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-in { animation: slide-in 0.25s ease-out; }
        .field-bg {
          background-image:
            linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.02) 100%),
            repeating-linear-gradient(90deg, transparent 0, transparent 24px, rgba(255,255,255,0.025) 24px, rgba(255,255,255,0.025) 25px);
        }
      `}</style>
      <ScoringScreen />
    </div>
  );
}

// ===== MAIN SCREEN =====
function ScoringScreen() {
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [armed, setArmed] = useState({ p1: null, p2: null }); // mod key
  const [hands, setHands] = useState(INITIAL_HANDS);
  const [usedCards, setUsedCards] = useState({ p1: [], p2: [] });
  const [events, setEvents] = useState([]); // { id, player, type, points, card, negated }
  const [interrupt, setInterrupt] = useState(null); // { defender, eventId, eventType, expiresAt }
  const [undoable, setUndoable] = useState(null); // { eventId, expiresAt }
  const [winner, setWinner] = useState(null);
  const [showLog, setShowLog] = useState(false);
  const [picker, setPicker] = useState(null); // { player } | null
  const [now, setNow] = useState(Date.now());

  // tick for timers
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (interrupt && now > interrupt.expiresAt) setInterrupt(null);
    if (undoable && now > undoable.expiresAt) setUndoable(null);
  }, [now, interrupt, undoable]);

  const opponent = (p) => (p === "p1" ? "p2" : "p1");

  function recordEvent(player, type, points, card = null) {
    const id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const evt = { id, player, type, points, card, negated: false, ts: Date.now() };
    setEvents((e) => [evt, ...e].slice(0, 50));
    setScores((s) => ({ ...s, [player]: s[player] + points }));
    setUndoable({ eventId: id, expiresAt: Date.now() + UNDO_WINDOW_MS });
    // open interrupt window for opponent on TD or FG
    if (type === "touchdown" || type === "super_touchdown") {
      const oppHas = hands[opponent(player)].includes("pick_six");
      if (oppHas)
        setInterrupt({
          defender: opponent(player),
          eventId: id,
          eventType: "td",
          expiresAt: Date.now() + INTERRUPT_WINDOW_MS,
        });
    } else if (type === "field_goal" || type === "super_field_goal") {
      const oppHas = hands[opponent(player)].includes("block_fg");
      if (oppHas)
        setInterrupt({
          defender: opponent(player),
          eventId: id,
          eventType: "fg",
          expiresAt: Date.now() + INTERRUPT_WINDOW_MS,
        });
    }
    return evt;
  }

  function consumeArmed(player) {
    const cardKey = armed[player];
    if (!cardKey) return;
    setArmed((a) => ({ ...a, [player]: null }));
    setHands((h) => ({ ...h, [player]: h[player].filter((c) => c !== cardKey) }));
    setUsedCards((u) => ({ ...u, [player]: [...u[player], cardKey] }));
  }

  function score(player, baseType) {
    if (winner) return;
    const mod = armed[player];
    let type = baseType;
    let points = baseType === "touchdown" ? 6 : baseType === "field_goal" ? 3 : 1;
    let cardLabel = null;

    if (baseType === "touchdown" && mod === "super_td") {
      type = "super_touchdown";
      points = 10;
      cardLabel = CARD_DEFS.super_td.name;
      consumeArmed(player);
    } else if (baseType === "field_goal" && mod === "super_fg") {
      type = "super_field_goal";
      points = 10;
      cardLabel = CARD_DEFS.super_fg.name;
      consumeArmed(player);
    } else if (baseType === "extra_point" && mod === "extra_points") {
      type = "extra_points_card";
      points = 3;
      cardLabel = CARD_DEFS.extra_points.name;
      consumeArmed(player);
    } else if (baseType === "field_goal" && mod === "fg_card") {
      cardLabel = CARD_DEFS.fg_card.name;
      consumeArmed(player);
    }

    recordEvent(player, type, points, cardLabel);
    // Check win
    setTimeout(() => {
      setScores((s) => {
        if (s[player] > WIN_THRESHOLD && !winner) setWinner(player);
        return s;
      });
    }, 50);
  }

  function tapCard(player, cardKey) {
    if (winner) return;
    const card = CARD_DEFS[cardKey];
    if (!card.armable) return; // positional cards: TODO
    setArmed((a) => ({ ...a, [player]: a[player] === cardKey ? null : cardKey }));
  }

  function undo() {
    if (!undoable) return;
    const ev = events.find((e) => e.id === undoable.eventId);
    if (!ev) return;
    setEvents((es) => es.filter((e) => e.id !== ev.id));
    setScores((s) => ({ ...s, [ev.player]: Math.max(0, s[ev.player] - ev.points) }));
    setUndoable(null);
    if (interrupt && interrupt.eventId === ev.id) setInterrupt(null);
  }

  function activateInterrupt() {
    if (!interrupt) return;
    const targetEvent = events.find((e) => e.id === interrupt.eventId);
    if (!targetEvent) return;
    // negate the original event
    setEvents((es) =>
      es.map((e) => (e.id === targetEvent.id ? { ...e, negated: true } : e))
    );
    setScores((s) => ({
      ...s,
      [targetEvent.player]: Math.max(0, s[targetEvent.player] - targetEvent.points),
    }));
    // record the negation event from defender
    const cardKey = interrupt.eventType === "td" ? "pick_six" : "block_fg";
    const newId = `evt_${Date.now()}`;
    setEvents((es) => [
      {
        id: newId,
        player: interrupt.defender,
        type: cardKey === "pick_six" ? "negate_touchdown" : "negate_field_goal",
        points: 0,
        card: CARD_DEFS[cardKey].name,
        negated: false,
        ts: Date.now(),
      },
      ...es,
    ]);
    // Remove card from defender's hand
    setHands((h) => ({
      ...h,
      [interrupt.defender]: h[interrupt.defender].filter((c) => c !== cardKey),
    }));
    setUsedCards((u) => ({
      ...u,
      [interrupt.defender]: [...u[interrupt.defender], cardKey],
    }));
    setInterrupt(null);
    setUndoable(null);
  }

  function reset() {
    setScores({ p1: 0, p2: 0 });
    setArmed({ p1: null, p2: null });
    setHands(INITIAL_HANDS);
    setUsedCards({ p1: [], p2: [] });
    setEvents([]);
    setInterrupt(null);
    setUndoable(null);
    setWinner(null);
    setPicker(null);
  }

  function openPicker(player) {
    if (winner) return;
    if (hands[player].length >= 3) return;
    setPicker({ player });
  }

  function drawCard(cardKey) {
    if (!picker) return;
    const player = picker.player;
    setHands((h) => ({ ...h, [player]: [...h[player], cardKey] }));
    setPicker(null);
  }

  function removeCard(player, slotIndex) {
    if (winner) return;
    const removedKey = hands[player][slotIndex];
    setHands((h) => ({
      ...h,
      [player]: h[player].filter((_, i) => i !== slotIndex),
    }));
    // Clear armed state if the removed card was armed
    if (armed[player] === removedKey) {
      setArmed((a) => ({ ...a, [player]: null }));
    }
  }

  const undoSecondsLeft = undoable
    ? Math.max(0, Math.ceil((undoable.expiresAt - now) / 1000))
    : 0;
  const interruptSecondsLeft = interrupt
    ? Math.max(0, Math.ceil((interrupt.expiresAt - now) / 1000))
    : 0;

  // last event for "just scored TD" detection (for Extra Points card eligibility)
  const lastEventByPlayer = (p) => events.find((e) => e.player === p && !e.negated);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== HEADER ===== */}
      <header className="px-4 py-2.5 border-b border-white/10 bg-black flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded bg-red-600 flex items-center justify-center flex-shrink-0">
            <span className="font-display text-sm">T</span>
          </div>
          <div className="min-w-0">
            <div className="text-xs font-display tracking-wider truncate">
              FRIDAY NIGHT FLICKS · WINNERS R2
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />
              <span className="text-[10px] text-emerald-300 font-bold tracking-wider">
                LIVE · SYNCED
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {undoable && (
            <button
              onClick={undo}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all hover:bg-amber-500/30"
            >
              <Undo2 className="w-3 h-3" />
              UNDO {undoSecondsLeft}s
            </button>
          )}
          <button
            onClick={() => setShowLog(!showLog)}
            className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center"
          >
            <Activity className="w-4 h-4" />
          </button>
          <button
            onClick={reset}
            className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ===== PLAYER 2 (BLUE) — top of screen, rotated 180° for opposite-side viewing ===== */}
      <PlayerPanel
        player="p2"
        team="blue"
        name="Sam K."
        score={scores.p2}
        opponentScore={scores.p1}
        armed={armed.p2}
        hand={hands.p2}
        usedCards={usedCards.p2}
        lastEvent={lastEventByPlayer("p2")}
        onScore={score}
        onTapCard={tapCard}
        onDraw={() => openPicker("p2")}
        onRemoveCard={(slotIndex) => removeCard("p2", slotIndex)}
        interrupt={interrupt && interrupt.defender === "p2" ? interrupt : null}
        interruptSecondsLeft={interruptSecondsLeft}
        onActivateInterrupt={activateInterrupt}
        winner={winner}
        flipped
      />

      {/* ===== CENTER DIVIDER (symmetric for both viewing angles) ===== */}
      <div className="bg-black px-4 py-2.5 border-y border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-white/5 rounded-full relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-700 to-red-500 transition-all"
              style={{ width: `${Math.min(100, (scores.p1 / WIN_THRESHOLD) * 100)}%` }}
            />
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-white/30 flex-shrink-0" />
          <div className="flex-1 h-2 bg-white/5 rounded-full relative overflow-hidden">
            <div
              className="absolute inset-y-0 right-0 bg-gradient-to-l from-blue-700 to-blue-500 transition-all"
              style={{ width: `${Math.min(100, (scores.p2 / WIN_THRESHOLD) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ===== PLAYER 1 (RED) — bottom of screen, natural phone-hold position ===== */}
      <PlayerPanel
        player="p1"
        team="red"
        name="Marcus T."
        score={scores.p1}
        opponentScore={scores.p2}
        armed={armed.p1}
        hand={hands.p1}
        usedCards={usedCards.p1}
        lastEvent={lastEventByPlayer("p1")}
        onScore={score}
        onTapCard={tapCard}
        onDraw={() => openPicker("p1")}
        onRemoveCard={(slotIndex) => removeCard("p1", slotIndex)}
        interrupt={interrupt && interrupt.defender === "p1" ? interrupt : null}
        interruptSecondsLeft={interruptSecondsLeft}
        onActivateInterrupt={activateInterrupt}
        winner={winner}
      />

      {/* ===== EVENT LOG (slide-out) ===== */}
      {showLog && (
        <EventLog events={events} onClose={() => setShowLog(false)} />
      )}

      {/* ===== CARD PICKER ===== */}
      {picker && (
        <CardPicker
          player={picker.player}
          team={picker.player === "p1" ? "red" : "blue"}
          onPick={drawCard}
          onCancel={() => setPicker(null)}
        />
      )}

      {/* ===== WIN MODAL ===== */}
      {winner && (
        <WinModal
          winner={winner}
          name={winner === "p1" ? "Marcus T." : "Sam K."}
          team={winner === "p1" ? "red" : "blue"}
          score={scores[winner]}
          oppScore={scores[winner === "p1" ? "p2" : "p1"]}
          onConfirm={reset}
        />
      )}
    </div>
  );
}

// ===== PLAYER PANEL =====
function PlayerPanel({
  player,
  team,
  name,
  score,
  armed,
  hand,
  usedCards,
  lastEvent,
  onScore,
  onTapCard,
  onDraw,
  onRemoveCard,
  interrupt,
  interruptSecondsLeft,
  onActivateInterrupt,
  winner,
  flipped = false,
}) {
  const isWinner = winner === player;
  const isLoser = winner && winner !== player;
  const teamColors = {
    red: {
      bg: "from-red-950/60 to-black",
      led: "led-red",
      border: "border-red-900/40",
      btnPrimary:
        "bg-red-600 hover:bg-red-500 active:bg-red-700 border-red-500",
      btnGhost: "bg-red-950/50 hover:bg-red-900/50 border-red-900/60",
      accent: "text-red-400",
    },
    blue: {
      bg: "from-blue-950/60 to-black",
      led: "led-blue",
      border: "border-blue-900/40",
      btnPrimary:
        "bg-blue-600 hover:bg-blue-500 active:bg-blue-700 border-blue-500",
      btnGhost: "bg-blue-950/50 hover:bg-blue-900/50 border-blue-900/60",
      accent: "text-blue-400",
    },
  };
  const c = teamColors[team];

  const justScoredTD =
    lastEvent &&
    (lastEvent.type === "touchdown" || lastEvent.type === "super_touchdown") &&
    Date.now() - lastEvent.ts < 30_000;

  // Compute button labels with modifier preview
  const tdLabel = armed === "super_td" ? "SUPER TD" : "TD";
  const tdPoints = armed === "super_td" ? 10 : 6;
  const fgLabel = armed === "super_fg" ? "SUPER FG" : "FG";
  const fgPoints = armed === "super_fg" ? 10 : 3;
  const xpLabel = armed === "extra_points" ? "EXTRA PTS" : "XP";
  const xpPoints = armed === "extra_points" ? 3 : 1;
  const xpEnabled = justScoredTD;

  return (
    <section
      className={`relative flex-1 bg-gradient-to-b ${c.bg} field-bg px-4 py-4 ${
        isLoser ? "opacity-50" : ""
      } ${flipped ? "rotate-180" : ""}`}
    >
      {/* Player tag + score */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div
            className={`text-[10px] font-bold tracking-[0.2em] ${c.accent} mb-0.5`}
          >
            {team.toUpperCase()} TEAM
          </div>
          <div className="font-display text-2xl tracking-wide truncate">
            {name}
          </div>
        </div>
        <div className="text-right">
          <div
            key={score}
            className={`font-mono font-black text-7xl leading-none ${c.led} score-pop tabular-nums`}
          >
            {score.toString().padStart(2, "0")}
          </div>
          {isWinner && (
            <div className="flex items-center justify-end gap-1 mt-1 text-amber-400">
              <Trophy className="w-3 h-3" />
              <span className="text-[10px] font-bold tracking-wider">
                WINNER
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Defensive interrupt banner */}
      {interrupt && (
        <button
          onClick={onActivateInterrupt}
          className="w-full mb-2.5 rounded-lg bg-gradient-to-r from-red-600 to-red-700 border-2 border-red-400 px-3 py-2.5 flex items-center justify-between interrupt-pulse slide-in"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <div className="text-left">
              <div className="font-display text-sm tracking-wider">
                {interrupt.eventType === "td" ? "PICK SIX!" : "BLOCK FG!"}
              </div>
              <div className="text-[10px] opacity-80">
                Negate opponent's {interrupt.eventType === "td" ? "TD" : "FG"}
              </div>
            </div>
          </div>
          <div className="font-mono text-xs bg-black/40 px-2 py-1 rounded">
            {interruptSecondsLeft}s
          </div>
        </button>
      )}

      {/* Score buttons row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <ScoreButton
          label={tdLabel}
          points={tdPoints}
          armed={armed === "super_td"}
          color={c.btnPrimary}
          onClick={() => onScore(player, "touchdown")}
          disabled={!!winner}
        />
        <ScoreButton
          label={xpLabel}
          points={xpPoints}
          armed={armed === "extra_points"}
          color={xpEnabled ? c.btnGhost : "bg-white/5 border-white/10"}
          onClick={() => onScore(player, "extra_point")}
          disabled={!xpEnabled || !!winner}
          subtle={!xpEnabled}
        />
        <ScoreButton
          label={fgLabel}
          points={fgPoints}
          armed={armed === "super_fg" || armed === "fg_card"}
          color={c.btnPrimary}
          onClick={() => onScore(player, "field_goal")}
          disabled={!!winner}
        />
      </div>

      {/* Card hand */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
          Action Cards · {hand.length}/3
        </span>
        {armed && (
          <span className="text-[10px] uppercase tracking-[0.15em] text-amber-400 font-bold">
            ⚡ ARMED
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {hand.map((cardKey, i) => (
          <ActionCard
            key={`${cardKey}-${i}`}
            cardKey={cardKey}
            armed={armed === cardKey}
            onTap={() => onTapCard(player, cardKey)}
            onRemove={() => onRemoveCard(i)}
            disabled={!!winner}
          />
        ))}
        {/* Draw slots for empty positions */}
        {Array.from({ length: 3 - hand.length }).map((_, i) => (
          <button
            key={`draw-${i}`}
            onClick={onDraw}
            disabled={!!winner}
            className={`aspect-[4/5] rounded border-2 border-dashed ${
              team === "red"
                ? "border-red-500/40 hover:border-red-400 hover:bg-red-950/40"
                : "border-blue-500/40 hover:border-blue-400 hover:bg-blue-950/40"
            } flex flex-col items-center justify-center transition-all active:scale-95 disabled:opacity-30`}
          >
            <ChevronUp className="w-4 h-4 text-slate-400 mb-0.5" />
            <span className="font-display text-[11px] tracking-wider text-slate-300">
              DRAW
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

// ===== SCORE BUTTON =====
function ScoreButton({ label, points, armed, color, onClick, disabled, subtle }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative rounded-lg border-2 ${color} py-3 px-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] ${
        armed ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-black" : ""
      }`}
    >
      <div
        className={`font-display text-base tracking-wider leading-none ${
          subtle ? "text-slate-500" : ""
        }`}
      >
        {label}
      </div>
      <div
        className={`font-mono font-black text-xl mt-0.5 ${
          armed ? "text-amber-300" : subtle ? "text-slate-600" : ""
        }`}
      >
        +{points}
      </div>
    </button>
  );
}

// ===== ACTION CARD =====
function ActionCard({ cardKey, armed, onTap, disabled }) {
  const card = CARD_DEFS[cardKey];
  const colorMap = {
    blue: {
      bg: "bg-gradient-to-b from-blue-700 to-blue-900",
      border: "border-blue-400",
      tag: "bg-blue-500/30 text-blue-200",
    },
    red: {
      bg: "bg-gradient-to-b from-red-700 to-red-900",
      border: "border-red-400",
      tag: "bg-red-500/30 text-red-200",
    },
    green: {
      bg: "bg-gradient-to-b from-emerald-700 to-emerald-900",
      border: "border-emerald-400",
      tag: "bg-emerald-500/30 text-emerald-200",
    },
  };
  const c = colorMap[card.color];

  const Icon =
    card.color === "red" ? Shield : card.color === "green" ? Zap : Flame;

  return (
    <button
      onClick={onTap}
      disabled={disabled || (!card.armable && !card.interrupt)}
      className={`relative aspect-[4/5] rounded ${c.bg} border ${
        c.border
      } overflow-hidden text-left transition-all active:scale-95 disabled:opacity-40 ${
        armed ? "glow-armed scale-[1.04]" : ""
      } ${!card.armable ? "opacity-70" : ""}`}
    >
      <div
        className={`text-[8px] font-bold tracking-[0.15em] px-1.5 py-0.5 ${c.tag} flex items-center gap-1`}
      >
        <Icon className="w-2 h-2" />
        {card.type}
      </div>
      <div className="px-1.5 pt-1">
        <div className="font-display text-[11px] leading-tight">
          {card.name}
        </div>
        <div className="text-[8px] text-white/60 mt-0.5 leading-tight">
          {card.desc}
        </div>
      </div>
      {!card.armable && !card.interrupt && (
        <div className="absolute bottom-0.5 right-1 text-[7px] text-white/40 italic">
          physical
        </div>
      )}
    </button>
  );
}

// ===== EVENT LOG =====
function EventLog({ events, onClose }) {
  return (
    <div
      className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-end slide-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-[#0a1628] border-t border-white/10 rounded-t-2xl max-h-[70vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="font-display text-lg tracking-wide">EVENT LOG</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center"
          >
            <ChevronUp className="w-4 h-4 rotate-180" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {events.length === 0 && (
            <div className="text-center text-slate-500 py-8 text-sm">
              No scoring events yet
            </div>
          )}
          {events.map((e) => (
            <LogRow key={e.id} e={e} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LogRow({ e }) {
  const isP1 = e.player === "p1";
  const labels = {
    touchdown: "Touchdown",
    super_touchdown: "Super Touchdown",
    extra_point: "Extra Point",
    extra_points_card: "Extra Points (card)",
    field_goal: "Field Goal",
    super_field_goal: "Super Field Goal",
    negate_touchdown: "PICK SIX (negated TD)",
    negate_field_goal: "BLOCK FG (negated FG)",
  };
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
        e.negated ? "opacity-40 line-through" : ""
      } ${isP1 ? "bg-red-950/30" : "bg-blue-950/30"}`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isP1 ? "bg-red-500" : "bg-blue-500"
        }`}
      />
      <span className={`font-bold ${isP1 ? "text-red-300" : "text-blue-300"}`}>
        {isP1 ? "Marcus" : "Sam"}
      </span>
      <span className="flex-1 truncate">{labels[e.type] || e.type}</span>
      {e.card && (
        <span className="text-[10px] uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
          {e.card}
        </span>
      )}
      <span className="font-mono font-bold w-10 text-right">
        {e.points > 0 ? "+" : ""}
        {e.points}
      </span>
    </div>
  );
}

// ===== CARD PICKER (v1 tap-to-select) =====
function CardPicker({ player, team, onPick, onCancel }) {
  const teamAccent = team === "red" ? "text-red-400" : "text-blue-400";
  const teamBg =
    team === "red"
      ? "from-red-950/60 to-black"
      : "from-blue-950/60 to-black";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 slide-in"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md bg-gradient-to-br ${teamBg} border-t sm:border border-white/10 rounded-t-2xl sm:rounded-2xl overflow-hidden ${
          team === "blue" ? "rotate-180" : ""
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <div className={`text-[10px] uppercase tracking-[0.3em] ${teamAccent} mb-0.5`}>
              {team === "red" ? "Marcus T." : "Sam K."} · DRAW
            </div>
            <div className="font-display text-2xl tracking-wide leading-none">
              WHICH CARD?
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Helper text */}
        <div className="px-5 py-2.5 bg-black/30 border-b border-white/5 text-xs text-slate-400">
          Tap the card you just drew. Non-scoring cards (Bomb Pass, Sack, etc.) — leave the slot empty.
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-2 gap-2 p-3">
          {PICKER_CARDS.map((cardKey) => (
            <PickerCard
              key={cardKey}
              cardKey={cardKey}
              onPick={() => onPick(cardKey)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <QrCode className="w-3.5 h-3.5" />
            <span>v2: scan QR on card back</span>
          </div>
          <button
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-white px-2 py-1"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function PickerCard({ cardKey, onPick }) {
  const card = CARD_DEFS[cardKey];
  const colorMap = {
    blue: {
      bg: "bg-gradient-to-b from-blue-700 to-blue-900",
      border: "border-blue-400",
      tag: "bg-blue-500/30 text-blue-200",
    },
    red: {
      bg: "bg-gradient-to-b from-red-700 to-red-900",
      border: "border-red-400",
      tag: "bg-red-500/30 text-red-200",
    },
    green: {
      bg: "bg-gradient-to-b from-emerald-700 to-emerald-900",
      border: "border-emerald-400",
      tag: "bg-emerald-500/30 text-emerald-200",
    },
  };
  const c = colorMap[card.color];
  const Icon =
    card.color === "red" ? Shield : card.color === "green" ? Zap : Flame;

  return (
    <button
      onClick={onPick}
      className={`text-left rounded-lg ${c.bg} border-2 ${c.border} overflow-hidden p-3 transition-all active:scale-[0.97] hover:brightness-110`}
    >
      <div
        className={`text-[9px] font-bold tracking-[0.15em] inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${c.tag} mb-2`}
      >
        <Icon className="w-2.5 h-2.5" />
        {card.type}
      </div>
      <div className="font-display text-base leading-tight mb-1">
        {card.name}
      </div>
      <div className="text-[11px] text-white/70 leading-tight">
        {card.desc}
      </div>
    </button>
  );
}

// ===== WIN MODAL =====
function WinModal({ winner, name, team, score, oppScore, onConfirm }) {
  const accent = team === "red" ? "led-red" : "led-blue";
  const bg = team === "red" ? "from-red-950" : "from-blue-950";

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
      <div
        className={`w-full max-w-sm bg-gradient-to-br ${bg} to-black border border-white/10 rounded-2xl p-6 text-center slide-in`}
      >
        <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <div className="text-xs uppercase tracking-[0.3em] text-amber-400 mb-1">
          Match Complete
        </div>
        <div className="font-display text-4xl tracking-wide mb-1">
          {name}
        </div>
        <div className="text-sm text-slate-400 mb-5">wins the match</div>

        <div className="flex items-center justify-center gap-4 mb-6">
          <div className={`font-mono font-black text-5xl ${accent}`}>
            {score}
          </div>
          <div className="font-display text-2xl text-slate-600">—</div>
          <div className="font-mono font-black text-5xl text-slate-500">
            {oppScore}
          </div>
        </div>

        <button
          onClick={onConfirm}
          className="w-full py-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 font-display tracking-wider text-black transition-all"
        >
          CONFIRM &amp; ADVANCE BRACKET
        </button>
        <button
          onClick={onConfirm}
          className="w-full mt-2 py-2 text-xs text-slate-500 hover:text-slate-300"
        >
          Reset (demo)
        </button>
      </div>
    </div>
  );
}
