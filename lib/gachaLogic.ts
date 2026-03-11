import { type SupabaseClient } from "@supabase/supabase-js";
import { DAILY_PULL_LIMIT, rollRarity } from "@/lib/rarity";
import { type Card, type GachaResult } from "@/lib/types";
import { getCardOwnershipStats } from "@/lib/cardStats";

interface DailyGachaRow {
  pulls_used: number;
}

export class GachaLimitExceededError extends Error {
  constructor() {
    super("Daily pull limit reached.");
    this.name = "GachaLimitExceededError";
  }
}

export function getTodayDateKST(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
  }).format(new Date());
}

async function fetchDailyPulls(
  supabase: SupabaseClient,
  userId: string,
  date: string,
) {
  const { data, error } = await supabase
    .from("daily_gacha")
    .select("pulls_used")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle<DailyGachaRow>();

  if (error) {
    throw error;
  }

  return data?.pulls_used ?? 0;
}

async function pickRandomCardByRarity(
  supabase: SupabaseClient,
  rarity?: string,
): Promise<Card | null> {
  let query = supabase.from("cards").select("*");

  if (rarity) {
    query = query.eq("rarity", rarity);
  }

  const { data, error } = await query.limit(500);

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return null;
  }

  const index = Math.floor(Math.random() * data.length);
  return data[index] as Card;
}

export async function getDailyPullsRemaining(
  supabase: SupabaseClient,
  userId: string,
) {
  const date = getTodayDateKST();
  const pullsUsed = await fetchDailyPulls(supabase, userId, date);
  return Math.max(DAILY_PULL_LIMIT - pullsUsed, 0);
}

export async function performGachaPull(
  supabase: SupabaseClient,
  userId: string,
): Promise<GachaResult> {
  const date = getTodayDateKST();
  const pullsUsed = await fetchDailyPulls(supabase, userId, date);

  if (pullsUsed >= DAILY_PULL_LIMIT) {
    throw new GachaLimitExceededError();
  }

  const rolledRarity = rollRarity();
  let selectedCard = await pickRandomCardByRarity(supabase, rolledRarity);

  if (!selectedCard) {
    selectedCard = await pickRandomCardByRarity(supabase);
  }

  if (!selectedCard) {
    throw new Error("No cards available. Please import card data first.");
  }

  const now = new Date().toISOString();

  const { error: userCardError } = await supabase.from("user_cards").insert({
    user_id: userId,
    card_id: selectedCard.id,
    obtained_at: now,
  });

  if (userCardError) {
    throw userCardError;
  }

  const { error: logError } = await supabase.from("gacha_logs").insert({
    user_id: userId,
    card_id: selectedCard.id,
    rarity: selectedCard.rarity,
    created_at: now,
  });

  if (logError) {
    throw logError;
  }

  const { error: dailyError } = await supabase.from("daily_gacha").upsert(
    {
      user_id: userId,
      date,
      pulls_used: pullsUsed + 1,
    },
    {
      onConflict: "user_id,date",
    },
  );

  if (dailyError) {
    throw dailyError;
  }

  const ownership = await getCardOwnershipStats(supabase, selectedCard.id);
  const nextPullsUsed = pullsUsed + 1;

  return {
    card: selectedCard,
    ownership,
    pulls_used: nextPullsUsed,
    pulls_remaining: Math.max(DAILY_PULL_LIMIT - nextPullsUsed, 0),
    rarity: selectedCard.rarity,
  };
}
