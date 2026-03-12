import { redirect } from "next/navigation";
import Card from "@/components/Card";
import MainNav from "@/components/MainNav";
import { getCardOwnershipStats } from "@/lib/cardStats";
import { getDailyPullsRemaining, getTodayDateKST } from "@/lib/gachaLogic";
import { getRarityRank } from "@/lib/rarity";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { type Card as CardType } from "@/lib/types";

interface UserCardWithCard {
  card_id: string;
  cards: CardType | CardType[] | null;
}

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const [
    pullsQuery,
    userCardsQuery,
    totalCardsQuery,
    todayPullUsageQuery,
    pullsRemaining,
  ] = await Promise.all([
    supabase
      .from("gacha_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase.from("user_cards").select("card_id,cards(*)").eq("user_id", user.id),
    supabase.from("cards").select("*", { count: "exact", head: true }),
    supabase
      .from("daily_gacha")
      .select("pulls_used")
      .eq("user_id", user.id)
      .eq("date", getTodayDateKST())
      .maybeSingle<{ pulls_used: number }>(),
    getDailyPullsRemaining(supabase, user.id),
  ]);

  const totalPulls = pullsQuery.count ?? 0;
  const totalCards = totalCardsQuery.count ?? 0;
  const pullsUsedToday = todayPullUsageQuery.data?.pulls_used ?? 0;

  const allCards = (userCardsQuery.data as UserCardWithCard[] | null)
    ?.map((entry) => (Array.isArray(entry.cards) ? entry.cards[0] : entry.cards))
    .filter(Boolean) as CardType[] | undefined;

  const uniqueCardIds = new Set((allCards ?? []).map((card) => card.id));
  const completion =
    totalCards === 0
      ? 0
      : Number(((uniqueCardIds.size / totalCards) * 100).toFixed(1));

  const rarestCard =
    allCards?.sort((a, b) => getRarityRank(b.rarity) - getRarityRank(a.rarity))[0] ??
    null;

  const rarestCardOwnership = rarestCard
    ? await getCardOwnershipStats(supabase, rarestCard.id)
    : null;

  return (
    <>
      <MainNav />
      <main className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6">
        <header className="glass-panel rounded-2xl p-5">
          <h1 className="text-2xl font-bold text-zinc-100">프로필</h1>
          <p className="mt-1 text-sm text-zinc-300">{user.email}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
              <p className="text-zinc-400">총 뽑기 횟수</p>
              <p className="mt-1 text-xl font-semibold text-cyan-300">{totalPulls}</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
              <p className="text-zinc-400">오늘 사용</p>
              <p className="mt-1 text-xl font-semibold text-cyan-300">
                {pullsUsedToday}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
              <p className="text-zinc-400">오늘 남은 횟수</p>
              <p className="mt-1 text-xl font-semibold text-cyan-300">
                {pullsRemaining}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
              <p className="text-zinc-400">도감 완성률</p>
              <p className="mt-1 text-xl font-semibold text-cyan-300">{completion}%</p>
            </div>
          </div>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-100">가장 희귀한 카드</h2>
          {rarestCard ? (
            <Card card={rarestCard} ownership={rarestCardOwnership ?? undefined} />
          ) : (
            <p className="text-sm text-zinc-400">아직 획득한 카드가 없습니다.</p>
          )}
        </section>
      </main>
    </>
  );
}
