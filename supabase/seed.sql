-- TFL seed data
-- Run in the Supabase SQL editor (postgres role — bypasses RLS).
-- Requires at least one user in public.users. Create an account first, then run this.
-- Safe to re-run: cleans up previous seed rows before inserting.

DO $$
DECLARE
  v_mgr_email text := 'brian.locke@gmail.com'; -- ← change to your login email if different
  v_mgr_id    uuid;

  -- Fixed tournament IDs
  v_t_reg uuid := 'a0000000-0000-0000-0000-000000000001'; -- registration
  v_t_act uuid := 'a0000000-0000-0000-0000-000000000002'; -- active / in-bracket

  -- Registration tournament players
  v_rp1 uuid := 'b0000000-0000-0000-0000-000000000001';
  v_rp2 uuid := 'b0000000-0000-0000-0000-000000000002';
  v_rp3 uuid := 'b0000000-0000-0000-0000-000000000003';
  v_rp4 uuid := 'b0000000-0000-0000-0000-000000000004';

  -- Active tournament players (seeds 1–8)
  v_s1 uuid := 'c0000000-0000-0000-0000-000000000001'; -- Diesel
  v_s2 uuid := 'c0000000-0000-0000-0000-000000000002'; -- Flash
  v_s3 uuid := 'c0000000-0000-0000-0000-000000000003'; -- Hammer
  v_s4 uuid := 'c0000000-0000-0000-0000-000000000004'; -- Viper
  v_s5 uuid := 'c0000000-0000-0000-0000-000000000005'; -- Ghost
  v_s6 uuid := 'c0000000-0000-0000-0000-000000000006'; -- Blitz
  v_s7 uuid := 'c0000000-0000-0000-0000-000000000007'; -- Cobra
  v_s8 uuid := 'c0000000-0000-0000-0000-000000000008'; -- Storm

  -- Match IDs — Winners Bracket Round 1 (all complete)
  v_w1p1 uuid := 'd0000000-0000-0000-0000-000000000001'; -- Diesel vs Storm   → Diesel wins 17-9
  v_w1p2 uuid := 'd0000000-0000-0000-0000-000000000002'; -- Flash  vs Cobra   → Flash  wins 20-14
  v_w1p3 uuid := 'd0000000-0000-0000-0000-000000000003'; -- Hammer vs Blitz   → Blitz  wins 14-9 (upset)
  v_w1p4 uuid := 'd0000000-0000-0000-0000-000000000004'; -- Viper  vs Ghost   → Viper  wins 17-7

  -- Match IDs — Winners Bracket Round 2
  v_w2p1 uuid := 'd0000000-0000-0000-0000-000000000005'; -- Diesel vs Viper → ACTIVE (Viper leads 13-6)
  v_w2p2 uuid := 'd0000000-0000-0000-0000-000000000006'; -- Flash  vs Blitz → pending

  -- Match IDs — Losers Bracket Round 1 (pending)
  v_l1p1 uuid := 'd0000000-0000-0000-0000-000000000007'; -- Storm vs Ghost
  v_l1p2 uuid := 'd0000000-0000-0000-0000-000000000008'; -- Cobra vs Hammer

BEGIN
  -- ── Resolve manager ──────────────────────────────────────────────────────
  SELECT id INTO v_mgr_id FROM public.users WHERE email = v_mgr_email;
  IF v_mgr_id IS NULL THEN
    RAISE EXCEPTION 'No user found with email % — check v_mgr_email at the top of the script.', v_mgr_email;
  END IF;

  -- ── Clean up previous seed rows ──────────────────────────────────────────
  DELETE FROM public.scoring_events
    WHERE match_id IN (v_w1p1, v_w1p2, v_w1p3, v_w1p4, v_w2p1, v_w2p2, v_l1p1, v_l1p2);
  DELETE FROM public.matches
    WHERE id IN (v_w1p1, v_w1p2, v_w1p3, v_w1p4, v_w2p1, v_w2p2, v_l1p1, v_l1p2);
  DELETE FROM public.tournament_players
    WHERE tournament_id IN (v_t_reg, v_t_act);
  DELETE FROM public.tournaments
    WHERE id IN (v_t_reg, v_t_act);

  -- ── Tournament 1 — Registration (8-player, 4 joined) ─────────────────────
  INSERT INTO public.tournaments (id, name, manager_id, status, max_players, join_code)
  VALUES (v_t_reg, 'Friday Night TFL', v_mgr_id, 'registration', 8, 'TFL-SEED1');

  -- Manager joins as seed 1; rest are guests
  INSERT INTO public.tournament_players (id, tournament_id, user_id, guest_name, seed)
  VALUES
    (v_rp1, v_t_reg, v_mgr_id, NULL,     NULL),
    (v_rp2, v_t_reg, NULL,     'Marco',  NULL),
    (v_rp3, v_t_reg, NULL,     'Tyrone', NULL),
    (v_rp4, v_t_reg, NULL,     'Priya',  NULL);

  -- ── Tournament 2 — Active (8-player, bracket in progress) ────────────────
  INSERT INTO public.tournaments (id, name, manager_id, status, max_players, join_code)
  VALUES (v_t_act, 'TFL Championship — Season 1', v_mgr_id, 'active', 8, 'TFL-SEED2');

  INSERT INTO public.tournament_players (id, tournament_id, guest_name, seed, bracket_status)
  VALUES
    (v_s1, v_t_act, 'Diesel', 1, 'active'),   -- W2 active
    (v_s2, v_t_act, 'Flash',  2, 'active'),   -- W2 pending
    (v_s3, v_t_act, 'Hammer', 3, 'losers'),   -- lost W1, in L1
    (v_s4, v_t_act, 'Viper',  4, 'active'),   -- W2 active
    (v_s5, v_t_act, 'Ghost',  5, 'losers'),   -- lost W1, in L1
    (v_s6, v_t_act, 'Blitz',  6, 'active'),   -- W2 pending (upset winner)
    (v_s7, v_t_act, 'Cobra',  7, 'losers'),   -- lost W1, in L1
    (v_s8, v_t_act, 'Storm',  8, 'losers');   -- lost W1, in L1

  -- ── Matches — Winners Bracket Round 1 (complete) ─────────────────────────
  INSERT INTO public.matches
    (id, tournament_id, bracket, round, position, player1_id, player2_id, status, winner_id, completed_at)
  VALUES
    (v_w1p1, v_t_act, 'winners', 1, 1, v_s1, v_s8, 'complete', v_s1, now() - interval '2 hours'),
    (v_w1p2, v_t_act, 'winners', 1, 2, v_s2, v_s7, 'complete', v_s2, now() - interval '2 hours'),
    (v_w1p3, v_t_act, 'winners', 1, 3, v_s3, v_s6, 'complete', v_s6, now() - interval '90 minutes'),
    (v_w1p4, v_t_act, 'winners', 1, 4, v_s4, v_s5, 'complete', v_s4, now() - interval '90 minutes');

  -- ── Matches — Winners Bracket Round 2 ────────────────────────────────────
  INSERT INTO public.matches
    (id, tournament_id, bracket, round, position, player1_id, player2_id, status)
  VALUES
    (v_w2p1, v_t_act, 'winners', 2, 1, v_s1, v_s4, 'active'),
    (v_w2p2, v_t_act, 'winners', 2, 2, v_s2, v_s6, 'pending');

  -- ── Matches — Losers Bracket Round 1 (pending) ───────────────────────────
  INSERT INTO public.matches
    (id, tournament_id, bracket, round, position, player1_id, player2_id, status)
  VALUES
    (v_l1p1, v_t_act, 'losers', 1, 1, v_s8, v_s5, 'pending'),
    (v_l1p2, v_t_act, 'losers', 1, 2, v_s7, v_s3, 'pending');

  -- ── Scoring events — W1P1: Diesel vs Storm (Diesel wins 17–9) ────────────
  -- Diesel: TD(6) + XP(1) + TD(6) + XP(1) + FG(3) = 17
  -- Storm:  TD(6) + FG(3) = 9
  INSERT INTO public.scoring_events (match_id, player_id, event_type, points)
  VALUES
    (v_w1p1, v_s1, 'touchdown',       6),
    (v_w1p1, v_s1, 'extra_point_kick',1),
    (v_w1p1, v_s8, 'touchdown',       6),
    (v_w1p1, v_s1, 'touchdown',       6),
    (v_w1p1, v_s1, 'extra_point_kick',1),
    (v_w1p1, v_s8, 'field_goal',      3),
    (v_w1p1, v_s1, 'field_goal',      3);

  -- ── Scoring events — W1P2: Flash vs Cobra (Flash wins 20–14) ─────────────
  -- Flash: TD(6) + XP(1) + Super TD(10) + FG(3) = 20
  -- Cobra: TD(6) + XP(1) + TD(6) + XP(1) = 14
  INSERT INTO public.scoring_events (match_id, player_id, event_type, points, card_used)
  VALUES
    (v_w1p2, v_s2, 'touchdown',        6, NULL),
    (v_w1p2, v_s2, 'extra_point_kick', 1, NULL),
    (v_w1p2, v_s7, 'touchdown',        6, NULL),
    (v_w1p2, v_s7, 'extra_point_kick', 1, NULL),
    (v_w1p2, v_s2, 'super_touchdown', 10, 'Super Touchdown'),
    (v_w1p2, v_s7, 'touchdown',        6, NULL),
    (v_w1p2, v_s2, 'field_goal',       3, NULL),
    (v_w1p2, v_s7, 'extra_point_kick', 1, NULL);

  -- ── Scoring events — W1P3: Hammer vs Blitz (Blitz wins 14–9, upset) ──────
  -- Hammer: TD(6) + FG(3) = 9
  -- Blitz:  TD(6) + XP(1) + TD(6) + XP(1) = 14
  INSERT INTO public.scoring_events (match_id, player_id, event_type, points)
  VALUES
    (v_w1p3, v_s3, 'touchdown',        6),
    (v_w1p3, v_s6, 'touchdown',        6),
    (v_w1p3, v_s6, 'extra_point_kick', 1),
    (v_w1p3, v_s3, 'field_goal',       3),
    (v_w1p3, v_s6, 'touchdown',        6),
    (v_w1p3, v_s6, 'extra_point_kick', 1);

  -- ── Scoring events — W1P4: Viper vs Ghost (Viper wins 17–7) ──────────────
  -- Viper: TD(6) + XP(1) + TD(6) + XP(1) + FG(3) = 17
  -- Ghost: TD(6) + XP(1) = 7
  INSERT INTO public.scoring_events (match_id, player_id, event_type, points)
  VALUES
    (v_w1p4, v_s4, 'touchdown',        6),
    (v_w1p4, v_s4, 'extra_point_kick', 1),
    (v_w1p4, v_s5, 'touchdown',        6),
    (v_w1p4, v_s5, 'extra_point_kick', 1),
    (v_w1p4, v_s4, 'touchdown',        6),
    (v_w1p4, v_s4, 'extra_point_kick', 1),
    (v_w1p4, v_s4, 'field_goal',       3);

  -- ── Scoring events — W2P1: Diesel vs Viper (ACTIVE, Viper leads 13–6) ────
  -- Viper: TD(6) + XP(1) + TD(6) = 13
  -- Diesel: TD(6) = 6
  INSERT INTO public.scoring_events (match_id, player_id, event_type, points)
  VALUES
    (v_w2p1, v_s4, 'touchdown',        6),
    (v_w2p1, v_s4, 'extra_point_kick', 1),
    (v_w2p1, v_s1, 'touchdown',        6),
    (v_w2p1, v_s4, 'touchdown',        6);

  RAISE NOTICE E'\nSeed complete.\n  Manager:  %\n  Reg tournament (TFL-SEED1): %\n  Act tournament (TFL-SEED2): %\n  Active match (Diesel vs Viper, Viper leads 13-6): %',
    v_mgr_id, v_t_reg, v_t_act, v_w2p1;
END $$;
