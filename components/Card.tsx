"use client";

import { useEffect, useMemo, useState } from "react";
import { getRarityClassName, getRarityLabel } from "@/lib/rarity";
import { type Card as CardType, type CardOwnershipStats } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CardProps {
  card: CardType;
  ownership?: CardOwnershipStats;
  count?: number;
  className?: string;
}

const defaultStats: CardOwnershipStats = {
  owners: 0,
  total_users: 0,
  ownership_rate: 0,
};

export default function Card({
  card,
  ownership,
  count,
  className,
}: CardProps) {
  const [stats, setStats] = useState<CardOwnershipStats>(ownership ?? defaultStats);
  const [loadingStats, setLoadingStats] = useState(!ownership);

  useEffect(() => {
    if (ownership) {
      setStats(ownership);
      setLoadingStats(false);
      return;
    }

    let active = true;

    (async () => {
      try {
        setLoadingStats(true);
        const response = await fetch(`/api/card-stats/${card.id}`);
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as CardOwnershipStats;
        if (active) {
          setStats(payload);
        }
      } catch {
        // Keep rendering with a default value when stats API is unavailable.
      } finally {
        if (active) {
          setLoadingStats(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [card.id, ownership]);

  const hashtags = useMemo(() => {
    const categoryTag = card.category
      ? card.category.replaceAll(" ", "").slice(0, 20)
      : "책";
    const rarityTag = card.rarity.replaceAll(" ", "");
    return [`#BookGacha`, `#${categoryTag}`, `#${rarityTag}`];
  }, [card.category, card.rarity]);

  return (
    <article
      className={cn(
        "w-full max-w-[260px] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-100 shadow-xl",
        className,
      )}
    >
      <div className="p-4">
        <p
          className={cn(
            "mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold",
            getRarityClassName(card.rarity),
          )}
        >
          {getRarityLabel(card.rarity)}
        </p>

        <div className="aspect-[9/16] overflow-hidden rounded-xl bg-zinc-800">
          {card.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.cover_url}
              alt={card.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-3 text-center text-sm text-zinc-400">
              표지 이미지 없음
            </div>
          )}
        </div>

        <h3 className="mt-4 line-clamp-2 text-lg font-bold">{card.title}</h3>
        <p className="mt-1 text-sm text-zinc-300">{card.author}</p>
        <p className="mt-3 line-clamp-3 text-xs text-zinc-400">
          {card.summary ?? "오늘의 랜덤 책 카드입니다."}
        </p>

        <p className="mt-4 text-xs text-cyan-300">
          {loadingStats ? (
            "보유율 계산 중..."
          ) : (
            <>
              전체 유저의 <strong>{stats.ownership_rate.toFixed(1)}%</strong>가 보유
            </>
          )}
        </p>

        {typeof count === "number" ? (
          <p className="mt-1 text-xs text-zinc-400">보유 수량: {count}</p>
        ) : null}

        <p className="mt-4 text-[11px] text-zinc-500">{hashtags.join(" ")}</p>
      </div>
    </article>
  );
}
