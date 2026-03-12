import { NextResponse } from "next/server";
import { getCardOwnershipStats } from "@/lib/cardStats";
import { createPublicSupabaseClient } from "@/lib/supabase";

interface RouteContext {
  params: Promise<{ cardId: string }>;
}

export async function GET(_: Request, context: RouteContext) {
  try {
    const { cardId } = await context.params;
    const supabase = createPublicSupabaseClient();
    const stats = await getCardOwnershipStats(supabase, cardId);
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "보유율 정보를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
