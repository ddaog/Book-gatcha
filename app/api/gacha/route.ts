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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pullsRemaining = await getDailyPullsRemaining(supabase, user.id);
    return NextResponse.json({ pulls_remaining: pullsRemaining });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to read gacha state." },
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await performGachaPull(supabase, user.id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof GachaLimitExceededError) {
      return NextResponse.json(
        { error: "You already used all 5 daily pulls." },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gacha pull failed." },
      { status: 500 },
    );
  }
}
