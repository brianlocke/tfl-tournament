import { useState } from "react";
import {
  Trophy,
  Users,
  Plus,
  ChevronRight,
  Copy,
  Check,
  Share2,
  Activity,
  Calendar,
  ArrowLeft,
  Crown,
  Flame,
  Shield,
  Zap,
  Settings,
  GripVertical,
  Play,
  Eye,
} from "lucide-react";

// ------- MOCK DATA -------
const tournaments = [
  {
    id: 1,
    name: "Friday Night Flicks",
    status: "active",
    players: 16,
    maxPlayers: 16,
    matchesPlayed: 9,
    matchesTotal: 30,
    code: "TFL-FNF24",
    created: "2 days ago",
  },
  {
    id: 2,
    name: "Office League Week 4",
    status: "registration",
    players: 11,
    maxPlayers: 16,
    matchesPlayed: 0,
    matchesTotal: 30,
    code: "TFL-OFC04",
    created: "3 hours ago",
  },
  {
    id: 3,
    name: "Garage Showdown",
    status: "complete",
    players: 8,
    maxPlayers: 8,
    matchesPlayed: 14,
    matchesTotal: 14,
    code: "TFL-GAR23",
    created: "1 week ago",
    champion: "Marcus T.",
  },
  {
    id: 4,
    name: "Sunday Morning Cup",
    status: "active",
    players: 8,
    maxPlayers: 8,
    matchesPlayed: 4,
    matchesTotal: 14,
    code: "TFL-SMC09",
    created: "yesterday",
  },
];

const lobbyPlayers = [
  { seed: 1, name: "Marcus T.", record: "12-3", isYou: false },
  { seed: 2, name: "Aisha R.", record: "9-4", isYou: false },
  { seed: 3, name: "Diego M.", record: "8-5", isYou: true },
  { seed: 4, name: "Sam K.", record: "7-6", isYou: false },
  { seed: 5, name: "Priya N.", record: "6-4", isYou: false },
  { seed: 6, name: "Jordan W.", record: "5-7", isYou: false },
  { seed: 7, name: "Ben (Guest)", record: "—", isYou: false, guest: true },
  { seed: 8, name: "Lila O.", record: "4-3", isYou: false },
];

const liveMatches = [
  {
    id: 1,
    p1: "Marcus T.",
    p1Score: 24,
    p2: "Sam K.",
    p2Score: 13,
    bracket: "Winners R2",
    live: true,
  },
  {
    id: 2,
    p1: "Aisha R.",
    p1Score: 18,
    p2: "Priya N.",
    p2Score: 21,
    bracket: "Winners R2",
    live: true,
  },
  {
    id: 3,
    p1: "Diego M.",
    p1Score: 30,
    p2: "Jordan W.",
    p2Score: 17,
    bracket: "Winners R2",
    live: false,
    final: true,
    winner: "p1",
  },
];

// ------- APP -------
export default function App() {
  const [view, setView] = useState("dashboard");
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div
      className="min-h-screen bg-[#0a1628] text-white font-body"
      style={{ fontFamily: "Saira, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Saira:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
        .font-display { font-family: 'Anton', sans-serif; letter-spacing: 0.03em; }
        .font-body { font-family: 'Saira', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        .live-dot { animation: pulse-dot 1.4s ease-in-out infinite; }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-up { animation: slide-up 0.3s ease-out forwards; }
        .field-stripes {
          background-image: repeating-linear-gradient(
            90deg,
            transparent 0,
            transparent 38px,
            rgba(255,255,255,0.03) 38px,
            rgba(255,255,255,0.03) 39px
          );
        }
      `}</style>

      <TopNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        {view === "dashboard" && (
          <Dashboard
            onSelect={(t) => {
              setSelected(t);
              setView("tournament");
            }}
            onCreate={() => setShowCreate(true)}
          />
        )}
        {view === "tournament" && selected && (
          <TournamentDetail
            t={selected}
            onBack={() => setView("dashboard")}
          />
        )}
      </main>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

// ------- TOP NAV -------
function TopNav() {
  return (
    <header className="border-b border-white/5 bg-[#0a1628]/95 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/40">
            <span className="font-display text-xl text-white">T</span>
          </div>
          <div>
            <div className="font-display text-xl tracking-wider leading-none">
              TFL <span className="text-red-500">MANAGER</span>
            </div>
            <div className="text-[10px] text-slate-400 uppercase tracking-[0.2em]">
              Table Football League
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot"></span>
            <span className="text-xs text-emerald-300 font-medium">2 LIVE</span>
          </div>
          <button className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-sm font-semibold ring-2 ring-white/10">
            DM
          </button>
        </div>
      </div>
    </header>
  );
}

// ------- DASHBOARD -------
function Dashboard({ onSelect, onCreate }) {
  return (
    <div className="slide-up">
      {/* Hero */}
      <section className="pt-8 pb-6">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-2">
          Manager Dashboard
        </div>
        <h1 className="font-display text-5xl sm:text-6xl leading-none">
          YOUR <span className="text-red-500">TOURNAMENTS</span>
        </h1>
        <p className="text-slate-400 mt-3 max-w-md">
          Run brackets. Track scores. Crown champions.
        </p>
      </section>

      {/* Stats strip */}
      <section className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
        <StatTile
          label="Active"
          value="2"
          sub="tournaments"
          accent="emerald"
        />
        <StatTile label="Players" value="43" sub="across all" accent="blue" />
        <StatTile label="Matches" value="13" sub="this week" accent="red" />
      </section>

      {/* Create CTA */}
      <button
        onClick={onCreate}
        className="w-full mb-8 group relative overflow-hidden rounded-lg border-2 border-red-600 bg-gradient-to-r from-red-600/20 to-red-700/10 hover:from-red-600/30 hover:to-red-700/20 transition-all p-5 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded bg-red-600 flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
            <Plus className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="font-display text-2xl tracking-wide">
              CREATE TOURNAMENT
            </div>
            <div className="text-xs text-slate-400">
              Generate a join link in seconds
            </div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-red-500 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Tournament list */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl tracking-wide text-slate-300">
            ALL TOURNAMENTS
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {tournaments.length} TOTAL
          </span>
        </div>
        <div className="grid gap-3">
          {tournaments.map((t) => (
            <TournamentCard key={t.id} t={t} onClick={() => onSelect(t)} />
          ))}
        </div>
      </section>
    </div>
  );
}

function StatTile({ label, value, sub, accent }) {
  const accents = {
    emerald: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
    blue: "text-blue-400 border-blue-500/30 bg-blue-500/5",
    red: "text-red-400 border-red-500/30 bg-red-500/5",
  };
  return (
    <div className={`rounded-lg border p-4 ${accents[accent]}`}>
      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-1">
        {label}
      </div>
      <div className="font-display text-4xl leading-none">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{sub}</div>
    </div>
  );
}

function TournamentCard({ t, onClick }) {
  const statusConfig = {
    active: {
      label: "LIVE",
      color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      pulse: true,
    },
    registration: {
      label: "OPEN",
      color: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    },
    complete: {
      label: "FINAL",
      color: "bg-slate-700/50 text-slate-400 border-slate-600",
    },
  };
  const cfg = statusConfig[t.status];
  const progress = (t.matchesPlayed / t.matchesTotal) * 100;

  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-white/15 p-4 sm:p-5 transition-all field-stripes"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`text-[10px] font-bold tracking-[0.15em] px-2 py-0.5 rounded border ${cfg.color} flex items-center gap-1.5`}
            >
              {cfg.pulse && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />
              )}
              {cfg.label}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {t.code}
            </span>
          </div>
          <h3 className="font-display text-2xl tracking-wide truncate">
            {t.name}
          </h3>
          {t.champion && (
            <div className="flex items-center gap-1.5 mt-1 text-amber-400 text-sm">
              <Crown className="w-3.5 h-3.5" />
              <span>Won by {t.champion}</span>
            </div>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          <span className="font-mono">
            {t.players}/{t.maxPlayers}
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          <span className="font-mono">
            {t.matchesPlayed}/{t.matchesTotal} matches
          </span>
        </span>
        <span className="hidden sm:flex items-center gap-1.5 ml-auto">
          <Calendar className="w-3.5 h-3.5" />
          {t.created}
        </span>
      </div>

      {t.status !== "registration" && (
        <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              t.status === "complete"
                ? "bg-gradient-to-r from-amber-500 to-amber-300"
                : "bg-gradient-to-r from-red-500 to-red-400"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </button>
  );
}

// ------- TOURNAMENT DETAIL -------
function TournamentDetail({ t, onBack }) {
  const [tab, setTab] = useState("lobby");
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="slide-up">
      <button
        onClick={onBack}
        className="mt-6 mb-4 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All tournaments
      </button>

      {/* Header */}
      <section className="rounded-lg bg-gradient-to-br from-slate-900 to-slate-900/40 border border-white/5 p-5 sm:p-6 mb-6 field-stripes">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold tracking-[0.15em] px-2 py-0.5 rounded border bg-emerald-500/20 text-emerald-300 border-emerald-500/40 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />
                LIVE
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {t.code}
              </span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl tracking-wide leading-none">
              {t.name}
            </h1>
          </div>
          <button className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center flex-shrink-0">
            <Settings className="w-4 h-4 text-slate-300" />
          </button>
        </div>

        {/* Share link */}
        <div className="flex items-stretch gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 bg-black/30 border border-white/5 rounded-lg px-3 py-2 min-w-0">
            <Share2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span className="text-sm font-mono text-slate-300 truncate">
              tfl.app/join/{t.code}
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

        <div className="grid grid-cols-3 gap-3 text-center">
          <MiniStat
            value={`${t.players}/${t.maxPlayers}`}
            label="Players"
            icon={Users}
          />
          <MiniStat
            value={`${t.matchesPlayed}/${t.matchesTotal}`}
            label="Matches"
            icon={Activity}
          />
          <MiniStat value="DBL ELIM" label="Format" icon={Trophy} />
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-white/5">
        {[
          { id: "lobby", label: "Lobby", icon: Users },
          { id: "bracket", label: "Bracket", icon: Trophy },
          { id: "matches", label: "Matches", icon: Flame },
        ].map((item) => (
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

      {tab === "lobby" && <LobbyView />}
      {tab === "bracket" && <BracketView />}
      {tab === "matches" && <MatchesView />}
    </div>
  );
}

function MiniStat({ value, label, icon: Icon }) {
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

// ------- LOBBY VIEW -------
function LobbyView() {
  return (
    <div className="slide-up">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-lg tracking-wide text-slate-300">
          SEEDED PLAYERS
        </h3>
        <span className="text-xs text-slate-500">Drag to reorder seeds</span>
      </div>
      <div className="space-y-2">
        {lobbyPlayers.map((p) => (
          <div
            key={p.seed}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
              p.isYou
                ? "bg-blue-500/10 border-blue-500/40"
                : "bg-slate-900/60 border-white/5 hover:border-white/15"
            }`}
          >
            <GripVertical className="w-4 h-4 text-slate-600" />
            <div
              className={`w-8 h-8 rounded font-display text-lg flex items-center justify-center flex-shrink-0 ${
                p.seed === 1
                  ? "bg-amber-500 text-slate-950"
                  : p.seed <= 4
                  ? "bg-red-600 text-white"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              {p.seed}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{p.name}</span>
                {p.guest && (
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
                    Guest
                  </span>
                )}
                {p.isYou && (
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500 text-white">
                    You
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Career: {p.record}
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="mt-5 w-full py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 font-display tracking-wider text-lg transition-all flex items-center justify-center gap-2">
        <Play className="w-5 h-5" /> START TOURNAMENT
      </button>
    </div>
  );
}

// ------- BRACKET VIEW -------
function BracketView() {
  const winnersR1 = [
    { p1: "Marcus T.", p2: "Lila O.", winner: 1, s1: 32, s2: 18 },
    { p1: "Sam K.", p2: "Ben (G.)", winner: 1, s1: 30, s2: 24 },
    { p1: "Aisha R.", p2: "Jordan W.", winner: 1, s1: 31, s2: 21 },
    { p1: "Priya N.", p2: "Diego M.", winner: 2, s1: 22, s2: 33 },
  ];
  const winnersR2 = [
    {
      p1: "Marcus T.",
      p2: "Sam K.",
      live: true,
      s1: 24,
      s2: 13,
    },
    { p1: "Aisha R.", p2: "Diego M.", live: true, s1: 18, s2: 21 },
  ];

  return (
    <div className="slide-up">
      {/* Winners */}
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-red-500" />
        <h3 className="font-display tracking-wide text-slate-300">
          WINNERS BRACKET
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">
            Round 1
          </div>
          <div className="space-y-2">
            {winnersR1.map((m, i) => (
              <BracketMatch key={i} m={m} />
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">
            Round 2
          </div>
          <div className="space-y-2 mt-6">
            {winnersR2.map((m, i) => (
              <BracketMatch key={i} m={m} />
            ))}
          </div>
        </div>
      </div>

      {/* Losers */}
      <div className="flex items-center gap-2 mb-3 mt-6">
        <Zap className="w-4 h-4 text-blue-500" />
        <h3 className="font-display tracking-wide text-slate-300">
          LOSERS BRACKET
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">
            Round 1
          </div>
          <div className="space-y-2">
            <BracketMatch
              m={{ p1: "Lila O.", p2: "Ben (G.)", waiting: true }}
            />
            <BracketMatch
              m={{ p1: "Jordan W.", p2: "Priya N.", waiting: true }}
            />
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">
            Round 2
          </div>
          <div className="space-y-2 mt-6 opacity-40">
            <BracketMatch m={{ p1: "TBD", p2: "TBD", placeholder: true }} />
            <BracketMatch m={{ p1: "TBD", p2: "TBD", placeholder: true }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function BracketMatch({ m }) {
  if (m.placeholder) {
    return (
      <div className="rounded border border-dashed border-white/10 p-2 text-center text-xs text-slate-600">
        TBD vs TBD
      </div>
    );
  }
  return (
    <div
      className={`rounded border overflow-hidden text-sm ${
        m.live
          ? "border-emerald-500/40 shadow-lg shadow-emerald-500/10"
          : m.waiting
          ? "border-blue-500/30"
          : "border-white/10"
      }`}
    >
      <div
        className={`px-2.5 py-1.5 flex items-center justify-between border-b border-white/5 ${
          m.winner === 1 ? "bg-red-500/10" : ""
        }`}
      >
        <span className={m.winner === 1 ? "text-white font-semibold" : "text-slate-300"}>
          {m.p1}
        </span>
        {m.s1 !== undefined && (
          <span
            className={`font-mono text-base ${
              m.winner === 1 ? "text-red-400" : "text-slate-400"
            }`}
          >
            {m.s1}
          </span>
        )}
      </div>
      <div
        className={`px-2.5 py-1.5 flex items-center justify-between ${
          m.winner === 2 ? "bg-red-500/10" : ""
        }`}
      >
        <span className={m.winner === 2 ? "text-white font-semibold" : "text-slate-300"}>
          {m.p2}
        </span>
        {m.s2 !== undefined && (
          <span
            className={`font-mono text-base ${
              m.winner === 2 ? "text-red-400" : "text-slate-400"
            }`}
          >
            {m.s2}
          </span>
        )}
      </div>
      {m.live && (
        <div className="bg-emerald-500/10 border-t border-emerald-500/30 px-2.5 py-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />
          <span className="text-[10px] uppercase tracking-[0.15em] text-emerald-300 font-bold">
            Live
          </span>
        </div>
      )}
    </div>
  );
}

// ------- MATCHES VIEW -------
function MatchesView() {
  return (
    <div className="slide-up space-y-3">
      {liveMatches.map((m) => (
        <MatchRow key={m.id} m={m} />
      ))}
    </div>
  );
}

function MatchRow({ m }) {
  const isP1Winning = m.p1Score > m.p2Score;
  return (
    <div
      className={`rounded-lg border overflow-hidden ${
        m.live
          ? "border-emerald-500/40 bg-gradient-to-r from-emerald-500/5 to-transparent"
          : m.final
          ? "border-white/5 bg-slate-900/60"
          : "border-white/10"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 text-xs">
        <span className="text-slate-400 font-mono">{m.bracket}</span>
        {m.live ? (
          <span className="flex items-center gap-1.5 text-emerald-300 font-bold tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 live-dot" />
            LIVE NOW
          </span>
        ) : (
          <span className="text-slate-500">FINAL</span>
        )}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-4">
        {/* P1 */}
        <div className="text-right">
          <div
            className={`font-display text-xl ${
              m.winner === "p1" || (m.live && isP1Winning)
                ? "text-white"
                : "text-slate-400"
            }`}
          >
            {m.p1}
          </div>
        </div>
        {/* Score */}
        <div className="flex items-center gap-3 px-4">
          <div
            className={`font-display text-4xl font-mono ${
              isP1Winning ? "text-red-500" : "text-slate-500"
            }`}
          >
            {m.p1Score}
          </div>
          <div className="text-slate-700 font-display text-2xl">—</div>
          <div
            className={`font-display text-4xl font-mono ${
              !isP1Winning ? "text-blue-500" : "text-slate-500"
            }`}
          >
            {m.p2Score}
          </div>
        </div>
        {/* P2 */}
        <div className="text-left">
          <div
            className={`font-display text-xl ${
              m.winner === "p2" || (m.live && !isP1Winning)
                ? "text-white"
                : "text-slate-400"
            }`}
          >
            {m.p2}
          </div>
        </div>
      </div>
      {m.live && (
        <button className="w-full py-2.5 bg-white/5 hover:bg-white/10 border-t border-white/5 text-sm font-medium flex items-center justify-center gap-2 transition-colors">
          <Eye className="w-4 h-4" /> Watch Live Scoring
        </button>
      )}
    </div>
  );
}

// ------- CREATE MODAL -------
function CreateModal({ onClose }) {
  const [size, setSize] = useState(8);
  const [name, setName] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 slide-up"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0a1628] border border-white/10 rounded-t-2xl sm:rounded-2xl w-full max-w-md overflow-hidden"
      >
        <div className="bg-gradient-to-r from-red-600/30 to-transparent border-b border-white/5 p-5">
          <div className="text-[10px] uppercase tracking-[0.3em] text-red-400 mb-1">
            New Tournament
          </div>
          <h2 className="font-display text-3xl tracking-wide leading-none">
            CREATE BRACKET
          </h2>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="text-xs uppercase tracking-[0.15em] text-slate-400 mb-2 block">
              Tournament Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Saturday Showdown"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-600 focus:border-red-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-[0.15em] text-slate-400 mb-2 block">
              Player Count
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[4, 8, 16, 32].map((n) => (
                <button
                  key={n}
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
            <div className="text-xs text-slate-300 leading-relaxed">
              Format is{" "}
              <span className="text-blue-300 font-semibold">
                Double Elimination
              </span>
              . Players need two losses to be eliminated. Grand Final reset if
              losers bracket champion wins.
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-lg border border-white/10 hover:bg-white/5 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={!name}
              className="flex-1 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-40 disabled:cursor-not-allowed font-display tracking-wider transition-all"
            >
              CREATE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
