"use client";

import { useMemo, useState } from "react";
import Card from "@/components/Card";
import { RARITY_VALUES } from "@/lib/types";
import { type Card as CardType } from "@/lib/types";

export interface CollectedCard {
  card: CardType;
  count: number;
}

interface CollectionGridProps {
  items: CollectedCard[];
}

export default function CollectionGrid({ items }: CollectionGridProps) {
  const [selectedRarity, setSelectedRarity] = useState<string>("All");

  const filteredItems = useMemo(() => {
    if (selectedRarity === "All") {
      return items;
    }
    return items.filter((item) => item.card.rarity === selectedRarity);
  }, [items, selectedRarity]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-100">My Collection</h2>
        <select
          className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
          value={selectedRarity}
          onChange={(event) => setSelectedRarity(event.target.value)}
        >
          <option value="All">All Rarities</option>
          {RARITY_VALUES.map((rarity) => (
            <option key={rarity} value={rarity}>
              {rarity}
            </option>
          ))}
        </select>
      </div>

      {filteredItems.length === 0 ? (
        <p className="text-sm text-zinc-400">No cards match this rarity yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {filteredItems.map((item) => (
            <Card key={item.card.id} card={item.card} count={item.count} />
          ))}
        </div>
      )}
    </section>
  );
}
