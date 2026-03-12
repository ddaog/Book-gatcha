export const RARITY_VALUES = [
  "Rare",
  "Super Rare",
  "Hero",
  "Myth",
  "Legend",
] as const;

export type Rarity = (typeof RARITY_VALUES)[number];

export interface Card {
  id: string;
  title: string;
  author: string;
  isbn: string;
  cover_url: string | null;
  summary: string | null;
  category: string | null;
  rarity: Rarity;
  created_at: string;
}

export interface CardOwnershipStats {
  owners: number;
  total_users: number;
  ownership_rate: number;
}

export interface GachaResult {
  card: Card;
  ownership: CardOwnershipStats;
  pulls_used: number;
  pulls_remaining: number;
  rarity: Rarity;
}
