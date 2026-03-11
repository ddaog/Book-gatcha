import { createClient } from "@supabase/supabase-js";
import { type Rarity } from "../lib/types";

const TARGET_BOOKS = 1000;
const PAGE_SIZE = 100;

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

const data4LibraryApiKey = getEnv("DATA4LIBRARY_API_KEY");
const aladinApiKey = getEnv("ALADIN_API_KEY");
const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

interface RawLibraryBook {
  bookname: string;
  authors: string;
  isbn13: string;
  loanCnt?: string | number;
}

interface AladinBook {
  cover: string | null;
  description: string | null;
  categoryName: string | null;
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function rarityFromLoanCount(loanCnt: number): Rarity {
  if (loanCnt >= 300) return "Legend";
  if (loanCnt >= 220) return "Myth";
  if (loanCnt >= 150) return "Hero";
  if (loanCnt >= 80) return "Super Rare";
  return "Rare";
}

async function fetchLibraryPage(pageNo: number): Promise<RawLibraryBook[]> {
  const url = new URL("http://data4library.kr/api/loanItemSrch");
  url.searchParams.set("authKey", data4LibraryApiKey);
  url.searchParams.set("pageNo", String(pageNo));
  url.searchParams.set("pageSize", String(PAGE_SIZE));
  url.searchParams.set("format", "json");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`data4library request failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    response?: { docs?: Array<{ doc?: RawLibraryBook } | RawLibraryBook> };
  };

  const docs = payload.response?.docs ?? [];
  const normalized = docs.map((entry) => ("doc" in entry ? entry.doc : entry));

  return normalized.filter((entry): entry is RawLibraryBook => {
    return (
      Boolean(entry) &&
      typeof (entry as RawLibraryBook).isbn13 === "string" &&
      (entry as RawLibraryBook).isbn13.length > 0
    );
  });
}

async function fetchAladinByIsbn(isbn13: string): Promise<AladinBook> {
  const url = new URL("http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx");
  url.searchParams.set("ttbkey", aladinApiKey);
  url.searchParams.set("itemIdType", "ISBN13");
  url.searchParams.set("ItemId", isbn13);
  url.searchParams.set("output", "js");
  url.searchParams.set("Version", "20131101");
  url.searchParams.set("Cover", "Big");

  const response = await fetch(url.toString());
  if (!response.ok) {
    return { cover: null, description: null, categoryName: null };
  }

  const payload = (await response.json()) as {
    item?: Array<{
      cover?: string;
      description?: string;
      categoryName?: string;
    }>;
  };

  const item = payload.item?.[0];
  return {
    cover: item?.cover ?? null,
    description: item?.description ?? null,
    categoryName: item?.categoryName ?? null,
  };
}

async function run() {
  const dedupe = new Set<string>();
  const collected: RawLibraryBook[] = [];

  for (let pageNo = 1; collected.length < TARGET_BOOKS; pageNo += 1) {
    const books = await fetchLibraryPage(pageNo);
    if (books.length === 0) {
      break;
    }

    for (const book of books) {
      if (!book.isbn13 || dedupe.has(book.isbn13)) {
        continue;
      }
      dedupe.add(book.isbn13);
      collected.push(book);
      if (collected.length >= TARGET_BOOKS) {
        break;
      }
    }
  }

  const rows = [];
  for (const book of collected) {
    const aladin = await fetchAladinByIsbn(book.isbn13);
    const loanCnt = Number(book.loanCnt ?? 0);

    rows.push({
      title: book.bookname,
      author: book.authors || "Unknown",
      isbn: book.isbn13,
      cover_url: aladin.cover,
      summary:
        aladin.description?.slice(0, 300) ||
        `${book.bookname} by ${book.authors || "Unknown"}`,
      category: aladin.categoryName ?? "General",
      rarity: rarityFromLoanCount(loanCnt),
    });
  }

  const { error } = await supabase
    .from("cards")
    .upsert(rows, { onConflict: "isbn", ignoreDuplicates: false });

  if (error) {
    throw error;
  }

  console.log(`Imported ${rows.length} books into cards table.`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
