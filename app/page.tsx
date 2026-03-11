import Link from "next/link";
import AuthPanel from "@/components/AuthPanel";
import { Button } from "@/components/ui/button";
import { getDailyPullsRemaining } from "@/lib/gachaLogic";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pullsRemaining = user
    ? await getDailyPullsRemaining(supabase, user.id)
    : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-cyan-300">Book Gacha</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-300">
          Pull 5 cards daily, collect Korean library books, and share Instagram-ready
          cards with rarity + ownership stats.
        </p>
      </header>

      {user ? (
        <section className="glass-panel max-w-xl rounded-2xl p-5">
          <p className="text-sm text-zinc-300">Logged in as {user.email}</p>
          <p className="mt-3 text-lg font-semibold text-zinc-100">
            Daily pulls remaining:{" "}
            <span className="text-cyan-300">{pullsRemaining}</span> / 5
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/gacha">Start Gacha</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/collection">View Collection</Link>
            </Button>
          </div>
        </section>
      ) : (
        <section className="grid gap-6 md:grid-cols-2">
          <div className="glass-panel rounded-2xl p-5">
            <h2 className="text-xl font-semibold text-zinc-100">How it works</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-300">
              <li>Every account gets 5 free pulls daily.</li>
              <li>Rarity drop table follows production probabilities.</li>
              <li>Each card shows real ownership rate among players.</li>
              <li>Share cards as 9:16 social images for stories.</li>
            </ul>
          </div>

          <AuthPanel />
        </section>
      )}
    </main>
  );
}
