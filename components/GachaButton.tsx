"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type GachaResult } from "@/lib/types";

interface GachaButtonProps {
  onResult: (result: GachaResult) => void;
  onRemainingChange?: (remaining: number) => void;
}

export default function GachaButton({
  onResult,
  onRemainingChange,
}: GachaButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePull = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/gacha", {
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "가챠 뽑기에 실패했습니다.");
      }

      onResult(payload as GachaResult);
      onRemainingChange?.((payload as GachaResult).pulls_remaining);
    } catch (pullError) {
      setError(
        pullError instanceof Error
          ? pullError.message
          : "예상치 못한 오류가 발생했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      <Button
        type="button"
        size="lg"
        className="w-full"
        onClick={handlePull}
        disabled={isLoading}
      >
        <Sparkles className="mr-2 h-5 w-5" />
        {isLoading ? "뽑는 중..." : "가챠 뽑기"}
      </Button>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
