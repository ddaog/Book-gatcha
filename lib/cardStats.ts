import { type SupabaseClient } from "@supabase/supabase-js";
import { type CardOwnershipStats } from "@/lib/types";

function normalizeStats(
  statsRow:
    | {
        owners?: number | string | null;
        total_users?: number | string | null;
        ownership_rate?: number | string | null;
      }
    | null
    | undefined,
): CardOwnershipStats {
  return {
    owners: Number(statsRow?.owners ?? 0),
    total_users: Number(statsRow?.total_users ?? 0),
    ownership_rate: Number(statsRow?.ownership_rate ?? 0),
  };
}

export async function getCardOwnershipStats(
  supabase: SupabaseClient,
  cardId: string,
): Promise<CardOwnershipStats> {
  const { data, error } = await supabase.rpc("get_card_ownership_stats", {
    target_card_id: cardId,
  });

  if (!error && data) {
    const row = Array.isArray(data) ? data[0] : data;
    return normalizeStats(row);
  }

  const [{ data: ownersRows }, { data: playersRows }] = await Promise.all([
    supabase.from("user_cards").select("user_id").eq("card_id", cardId),
    supabase.from("gacha_logs").select("user_id"),
  ]);

  const owners = new Set((ownersRows ?? []).map((row) => row.user_id)).size;
  const totalUsers = new Set((playersRows ?? []).map((row) => row.user_id)).size;
  const ownershipRate =
    totalUsers === 0 ? 0 : Number(((owners / totalUsers) * 100).toFixed(1));

  return {
    owners,
    total_users: totalUsers,
    ownership_rate: ownershipRate,
  };
}
