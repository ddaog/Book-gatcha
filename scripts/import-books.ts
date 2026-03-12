import { createClient } from "@supabase/supabase-js";
import { type Rarity } from "../lib/types";

const TARGET_BOOKS = 1000;
const DISPLAY_SIZE = 100;
const MAX_START = 1000;
const UPSERT_CHUNK_SIZE = 200;

const DEFAULT_QUERIES = [
  "소설",
  "에세이",
  "자기계발",
  "경제경영",
  "인문",
  "과학",
  "역사",
  "심리",
  "여행",
  "요리",
];

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

const naverClientId = getEnv("NAVER_CLIENT_ID");
const naverClientSecret = getEnv("NAVER_CLIENT_SECRET");
const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
const queryList = (
  process.env.NAVER_BOOK_QUERIES?.split(",").map((item) => item.trim()) ??
  DEFAULT_QUERIES
).filter(Boolean);

interface NaverBook {
  title: string;
  link: string;
  image: string;
  author: string;
  discount: string;
  publisher: string;
  isbn: string;
  description: string;
  pubdate: string;
}

interface NaverBookResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverBook[];
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]*>/g, "");
}

function decodeHtmlEntities(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'");
}

function normalizeText(value: string): string {
  return decodeHtmlEntities(stripHtmlTags(value)).trim();
}

function extractIsbn13(rawIsbn: string): string | null {
  const candidates = rawIsbn
    .split(" ")
    .map((token) => token.replaceAll("-", "").trim())
    .filter(Boolean);

  const fromCandidates = candidates.find((token) => /^\d{13}$/.test(token));
  if (fromCandidates) {
    return fromCandidates;
  }

  const onlyDigits = rawIsbn.replaceAll(/[^0-9]/g, "");
  if (onlyDigits.length >= 13) {
    return onlyDigits.slice(-13);
  }

  return null;
}

function rarityFromIsbn(isbn13: string): Rarity {
  let hash = 0;
  for (let i = 0; i < isbn13.length; i += 1) {
    hash = (hash * 31 + isbn13.charCodeAt(i)) % 1000003;
  }
  const value = hash / 1000003;

  if (value < 0.02) return "Legend";
  if (value < 0.07) return "Myth";
  if (value < 0.22) return "Hero";
  if (value < 0.5) return "Super Rare";
  return "Rare";
}

async function fetchNaverBooks(query: string, start: number): Promise<NaverBookResponse> {
  const url = new URL("https://openapi.naver.com/v1/search/book.json");
  url.searchParams.set("query", query);
  url.searchParams.set("display", String(DISPLAY_SIZE));
  url.searchParams.set("start", String(start));
  url.searchParams.set("sort", "sim");

  const response = await fetch(url.toString(), {
    headers: {
      "X-Naver-Client-Id": naverClientId,
      "X-Naver-Client-Secret": naverClientSecret,
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`네이버 책 검색 API 요청 실패 (${response.status})`);
  }

  const payload = (await response.json()) as NaverBookResponse;
  return payload;
}

async function run() {
  const dedupe = new Set<string>();
  const rows: Array<{
    title: string;
    author: string;
    isbn: string;
    cover_url: string | null;
    summary: string;
    category: string;
    rarity: Rarity;
  }> = [];

  for (const query of queryList) {
    for (let start = 1; start <= MAX_START; start += DISPLAY_SIZE) {
      if (rows.length >= TARGET_BOOKS) {
        break;
      }

      const payload = await fetchNaverBooks(query, start);
      if (!payload.items?.length) {
        break;
      }

      for (const item of payload.items) {
        const isbn13 = extractIsbn13(item.isbn);
        if (!isbn13 || dedupe.has(isbn13)) {
          continue;
        }

        dedupe.add(isbn13);

        const title = normalizeText(item.title);
        const author = normalizeText(item.author).replaceAll("|", ", ") || "작자 미상";
        const summary = normalizeText(item.description).slice(0, 300);
        const category = query;

        rows.push({
          title,
          author,
          isbn: isbn13,
          cover_url: item.image || null,
          summary: summary || `${title} 도서 카드`,
          category,
          rarity: rarityFromIsbn(isbn13),
        });

        if (rows.length >= TARGET_BOOKS) {
          break;
        }
      }

      if (payload.start + payload.display > payload.total) {
        break;
      }
    }

    if (rows.length >= TARGET_BOOKS) {
      break;
    }
  }

  for (let i = 0; i < rows.length; i += UPSERT_CHUNK_SIZE) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK_SIZE);
    const { error } = await supabase
      .from("cards")
      .upsert(chunk, { onConflict: "isbn", ignoreDuplicates: false });
    if (error) {
      throw error;
    }
  }

  console.log(`네이버 API 기반으로 ${rows.length}권을 cards 테이블에 저장했습니다.`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
