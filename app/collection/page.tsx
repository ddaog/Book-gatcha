import { redirect } from "next/navigation";
import CollectionGrid, { type CollectedCard } from "@/components/CollectionGrid";
import MainNav from "@/components/MainNav";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { type Card } from "@/lib/types";

interface UserCardRow {
  card_id: string;
  cards: Card | Card[] | null;
}

export default async function CollectionPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data, error } = await supabase
    .from("user_cards")
    .select("card_id,cards(*)")
    .eq("user_id", user.id)
    .order("obtained_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const countMap = new Map<string, CollectedCard>();

  (data as UserCardRow[] | null)?.forEach((row) => {
    const linkedCard = Array.isArray(row.cards) ? row.cards[0] : row.cards;
    if (!linkedCard) {
      return;
    }

    const existing = countMap.get(linkedCard.id);
    if (existing) {
      existing.count += 1;
      return;
    }

    countMap.set(linkedCard.id, {
      card: linkedCard,
      count: 1,
    });
  });

  const items = Array.from(countMap.values());

  return (
    <>
      <MainNav />
      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        <header className="mb-4">
          <h1 className="text-2xl font-bold text-zinc-100">컬렉션</h1>
          <p className="mt-1 text-sm text-zinc-400">
            고유 카드: {items.length}장 / 총 획득 카드:{" "}
            {data?.length ?? 0}
          </p>
        </header>
        <CollectionGrid items={items} />
      </main>
    </>
  );
}
