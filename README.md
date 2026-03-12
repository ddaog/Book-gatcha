# 북 가챠 (Book Gacha) MVP

소셜 카드 수집형 웹앱 MVP입니다.  
유저는 매일 5회 가챠를 통해 책 카드를 획득하고, 카드 이미지를 스토리 형식으로 공유할 수 있습니다.

## 기술 스택

- Next.js 15 (App Router)
- React + TypeScript
- TailwindCSS
- Supabase (Postgres + Auth)
- Vercel OG (`@vercel/og`)

## 주요 기능

- Supabase Auth (회원가입/로그인/세션 유지)
- 보호 라우트: `/gacha`, `/collection`, `/profile`
- 일일 뽑기 제한: 1일 5회
- 희귀도 확률:
  - 희귀 50%
  - 초희귀 28%
  - 영웅 15%
  - 신화 5%
  - 전설 2%
- 카드 보유율 API:
  - `GET /api/card-stats/[cardId]`
- 가챠 API:
  - `GET /api/gacha` (남은 횟수)
  - `POST /api/gacha` (뽑기 실행)
- 카드 공유 이미지 API (9:16):
  - `GET /api/card-image/[cardId]`

## 환경 변수

`.env.example`을 복사해 `.env.local`을 생성하세요.

```bash
cp .env.example .env.local
```

필수:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NAVER_CLIENT_ID`
- `NAVER_CLIENT_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY` (책 import 스크립트에서 사용)

선택:

- `NAVER_BOOK_QUERIES`  
  예: `소설,에세이,자기계발,경제경영,인문,과학`

## DB 초기화

아래 파일을 Supabase SQL Editor에서 실행하세요.

- `supabase/schema.sql`

생성 테이블:

- `cards`
- `user_cards`
- `gacha_logs`
- `daily_gacha`

추가 구성:

- RLS 정책
- `get_card_ownership_stats(uuid)` 함수

## 네이버 책 API 세팅

네이버 개발자 센터 문서:  
https://developers.naver.com/docs/serviceapi/search/book/book.md

현재 import 스크립트는 해당 스펙에 맞춰 아래로 요청합니다.

- Endpoint: `GET https://openapi.naver.com/v1/search/book.json`
- Query params:
  - `query` (검색어)
  - `display` (최대 100)
  - `start` (최대 1000)
  - `sort` (`sim`)
- Headers:
  - `X-Naver-Client-Id`
  - `X-Naver-Client-Secret`

## 실행 방법

```bash
npm install
npm run dev
```

브라우저: `http://localhost:3000`

## 책 데이터 1000권 적재

```bash
npm run import:books
```

동작 방식:

1. 네이버 책 검색 API로 검색어별 책 데이터를 수집
2. ISBN13 기준 중복 제거
3. title/author/description 정제 후 카드 데이터 생성
4. `cards` 테이블에 `isbn` 기준 upsert

## 검증

```bash
npm run lint
npm run build
```
