import { type Rarity } from "@/lib/types";

export const RARITY_TABLE: ReadonlyArray<{ rarity: Rarity; chance: number }> = [
  { rarity: "Rare", chance: 0.5 },
  { rarity: "Super Rare", chance: 0.28 },
  { rarity: "Hero", chance: 0.15 },
  { rarity: "Myth", chance: 0.05 },
  { rarity: "Legend", chance: 0.02 },
];

export const DAILY_PULL_LIMIT = 5;

const rarityLabels: Record<Rarity, string> = {
  Rare: "희귀 (Rare)",
  "Super Rare": "초희귀 (Super Rare)",
  Hero: "영웅 (Hero)",
  Myth: "신화 (Myth)",
  Legend: "전설 (Legend)",
};

const rarityClassNames: Record<Rarity, string> = {
  Rare: "bg-slate-700 text-slate-100",
  "Super Rare": "bg-cyan-700 text-cyan-100",
  Hero: "bg-violet-700 text-violet-100",
  Myth: "bg-fuchsia-700 text-fuchsia-100",
  Legend: "bg-amber-500 text-amber-950",
};

const rarityRank: Record<Rarity, number> = {
  Rare: 1,
  "Super Rare": 2,
  Hero: 3,
  Myth: 4,
  Legend: 5,
};

export function rollRarity(randomValue = Math.random()): Rarity {
  let cumulative = 0;

  for (const entry of RARITY_TABLE) {
    cumulative += entry.chance;
    if (randomValue <= cumulative) {
      return entry.rarity;
    }
  }

  return "Rare";
}

export function getRarityLabel(rarity: Rarity): string {
  return rarityLabels[rarity];
}

export function getRarityClassName(rarity: Rarity): string {
  return rarityClassNames[rarity];
}

export function getRarityRank(rarity: Rarity): number {
  return rarityRank[rarity];
}
