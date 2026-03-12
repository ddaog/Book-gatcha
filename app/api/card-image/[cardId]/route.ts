import { ImageResponse } from "@vercel/og";
import { createElement } from "react";
import { getCardOwnershipStats } from "@/lib/cardStats";
import { getRarityLabel } from "@/lib/rarity";
import { createPublicSupabaseClient } from "@/lib/supabase";
import { type Card } from "@/lib/types";

export const runtime = "edge";
const IMAGE_SIZE = {
  width: 1080,
  height: 1920,
} as const;

interface RouteContext {
  params: Promise<{ cardId: string }>;
}

export async function GET(_: Request, context: RouteContext) {
  const { cardId } = await context.params;
  const supabase = createPublicSupabaseClient();

  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("id", cardId)
    .single();

  if (error || !data) {
    return new Response("카드를 찾을 수 없습니다.", { status: 404 });
  }

  const card = data as Card;
  const stats = await getCardOwnershipStats(supabase, card.id);

  const imageTree = createElement(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background:
          "linear-gradient(180deg, rgba(8,47,73,1) 0%, rgba(17,24,39,1) 45%, rgba(10,10,10,1) 100%)",
        color: "#f8fafc",
        padding: "72px",
        fontFamily: "sans-serif",
      },
    },
    createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "36px",
          overflow: "hidden",
          background: "rgba(15,23,42,0.65)",
          flex: 1,
        },
      },
      createElement(
        "div",
        {
          style: {
            padding: "36px 40px 20px",
            fontSize: 38,
            fontWeight: 700,
          },
        },
        getRarityLabel(card.rarity),
      ),
      createElement(
        "div",
        {
          style: {
            width: "100%",
            height: "1060px",
            background: "#0f172a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
        },
        card.cover_url
          ? createElement("img", {
              src: card.cover_url,
              alt: card.title,
              style: {
                width: "86%",
                height: "95%",
                objectFit: "cover",
                borderRadius: "18px",
              },
            })
          : createElement(
              "div",
              {
                style: {
                  color: "#94a3b8",
                  fontSize: 36,
                },
              },
              "표지 이미지 없음",
            ),
      ),
      createElement(
        "div",
        {
          style: {
            padding: "30px 40px 42px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          },
        },
        createElement(
          "div",
          {
            style: {
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 1.08,
            },
          },
          card.title,
        ),
        createElement(
          "div",
          {
            style: {
              fontSize: 34,
              color: "#cbd5e1",
            },
          },
          card.author,
        ),
        createElement(
          "div",
          {
            style: {
              fontSize: 28,
              color: "#67e8f9",
              marginTop: "10px",
            },
          },
          `전체 유저의 ${stats.ownership_rate.toFixed(1)}% 보유`,
        ),
        createElement(
          "div",
          {
            style: {
              fontSize: 22,
              color: "#94a3b8",
              marginTop: "8px",
            },
          },
          `#북가챠 #${getRarityLabel(card.rarity)}`,
        ),
      ),
    ),
  );

  return new ImageResponse(
    imageTree,
    {
      ...IMAGE_SIZE,
    },
  );
}
