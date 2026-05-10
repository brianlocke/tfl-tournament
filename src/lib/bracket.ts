export interface MatchInsert {
  tournament_id: string;
  bracket: "winners";
  round: number;
  position: number;
  player1_id: string | null;
  player2_id: string | null;
  status: "pending" | "complete";
  winner_id: string | null;
}

function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

// Returns seed numbers in standard bracket order so the top seeds stay
// in opposite halves and can only meet in the final.
// e.g. n=8 → [1, 8, 4, 5, 2, 7, 3, 6]
function buildBracketOrder(n: number): number[] {
  if (n === 2) return [1, 2];
  const prev = buildBracketOrder(n / 2);
  const result: number[] = [];
  for (const seed of prev) {
    result.push(seed);
    result.push(n + 1 - seed);
  }
  return result;
}

// Generates Winners Bracket Round 1 matches.
// Handles non-power-of-2 player counts by giving byes to the top seeds
// (a bye match is immediately marked complete with the real player as winner).
export function generateBracket(
  players: { id: string; seed: number }[],
  tournamentId: string
): MatchInsert[] {
  const n = players.length;
  const bracketSize = nextPowerOf2(n);
  const order = buildBracketOrder(bracketSize);
  const seedMap = new Map(players.map((p) => [p.seed, p.id]));

  const matches: MatchInsert[] = [];
  for (let i = 0; i < bracketSize; i += 2) {
    const s1 = order[i];
    const s2 = order[i + 1];
    const p1 = seedMap.get(s1) ?? null;
    const p2 = seedMap.get(s2) ?? null;
    const isBye = p1 === null || p2 === null;

    matches.push({
      tournament_id: tournamentId,
      bracket: "winners",
      round: 1,
      position: i / 2 + 1,
      player1_id: p1,
      player2_id: p2,
      status: isBye ? "complete" : "pending",
      winner_id: isBye ? (p1 ?? p2) : null,
    });
  }

  return matches;
}
