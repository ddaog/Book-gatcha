import { NextResponse } from "next/server";
import {
  getDailyPullsRemaining,
  GachaLimitExceededError,
  performGachaPull,
} from "@/lib/gachaLogic";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const pullsRemaining = await getDailyPullsRemaining(supabase, user.id);
    return NextResponse.json({ pulls_remaining: pullsRemaining });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "가챠 상태를 불러오지 못했습니다.",
      },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const result = await performGachaPull(supabase, user.id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof GachaLimitExceededError) {
      return NextResponse.json(
        { error: "오늘 뽑기 5회를 모두 사용했습니다." },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "가챠 뽑기에 실패했습니다." },
      { status: 500 },
    );
  }
}
