"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import GachaButton from "@/components/GachaButton";
import { Button } from "@/components/ui/button";
import { type GachaResult } from "@/lib/types";

export default function GachaClient() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [result, setResult] = useState<GachaResult | null>(null);
  const [shareLoading, setShareLoading] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const response = await fetch("/api/gacha");
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as { pulls_remaining: number };
        if (active) {
          setRemaining(payload.pulls_remaining);
        }
      } catch {
        // Allow UI to continue without preloaded pull state.
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleShare = async () => {
    if (!result) {
      return;
    }

    setShareLoading(true);

    try {
      const imageUrl = `${window.location.origin}/api/card-image/${result.card.id}`;

      if (navigator.share) {
        await navigator.share({
          title: `I pulled ${result.card.title} on Book Gacha!`,
          text: `Owned by ${result.ownership.ownership_rate.toFixed(1)}% of players`,
          url: imageUrl,
        });
      } else {
        window.open(imageUrl, "_blank", "noopener,noreferrer");
      }
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="glass-panel rounded-2xl p-5">
        <h1 className="text-2xl font-bold text-zinc-100">Daily Gacha</h1>
        <p className="mt-1 text-sm text-zinc-300">
          Pulls remaining today:{" "}
          <span className="font-semibold text-cyan-300">{remaining ?? "..."}</span> / 5
        </p>
        <div className="mt-4">
          <GachaButton
            onResult={(pullResult) => {
              setResult(pullResult);
              setRemaining(pullResult.pulls_remaining);
            }}
            onRemainingChange={setRemaining}
          />
        </div>
      </div>

      {result ? (
        <div className="reveal-animation rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="mb-3 text-lg font-semibold text-zinc-100">You pulled!</h2>
          <div className="flex flex-col items-center gap-4">
            <Card card={result.card} ownership={result.ownership} />
            <Button onClick={handleShare} disabled={shareLoading}>
              {shareLoading ? "Preparing share..." : "Share to Story"}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
