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
        <h1 className="text-3xl font-bold text-cyan-300">북 가챠</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-300">
          매일 5회 무료 뽑기로 책 카드를 모으고, 희귀도와 보유율을 인스타 스토리에
          공유해 보세요.
        </p>
      </header>

      {user ? (
        <section className="glass-panel max-w-xl rounded-2xl p-5">
          <p className="text-sm text-zinc-300">{user.email} 계정으로 로그인됨</p>
          <p className="mt-3 text-lg font-semibold text-zinc-100">
            오늘 남은 뽑기:{" "}
            <span className="text-cyan-300">{pullsRemaining}</span> / 5
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/gacha">가챠 시작</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/collection">컬렉션 보기</Link>
            </Button>
          </div>
        </section>
      ) : (
        <section className="grid gap-6 md:grid-cols-2">
          <div className="glass-panel rounded-2xl p-5">
            <h2 className="text-xl font-semibold text-zinc-100">게임 방식</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-300">
              <li>계정마다 하루 5회 무료 뽑기를 제공합니다.</li>
              <li>희귀도 확률은 운영 확률표를 그대로 적용합니다.</li>
              <li>카드마다 전체 유저 대비 실제 보유율을 보여줍니다.</li>
              <li>스토리용 9:16 이미지로 바로 공유할 수 있습니다.</li>
            </ul>
          </div>

          <AuthPanel />
        </section>
      )}
    </main>
  );
}
