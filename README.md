# 도장관 (DOJANGWAN)

태권도 도장 전용 SaaS 플랫폼 — 원생 관리, 출석, AI 품새 채점, 원격 승단 심사

## 개발 서버 실행

```bash
# 로컬 개발 (D1 DB 없음 — API 비동작)
npm run dev

# Cloudflare D1 연동 개발 (권장)
npx wrangler dev
```

## 빌드

```bash
npm run build
```

## 배포

`main` 브랜치에 push하면 GitHub Actions가 자동으로 Cloudflare Pages에 배포합니다.

### GitHub Secrets 설정

GitHub 저장소 → Settings → Secrets and variables → Actions → **New repository secret**

| Secret 이름 | 설명 | 발급 위치 |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API 토큰 | [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) → Create Token → Edit Cloudflare Workers 템플릿 사용 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 계정 ID | Cloudflare Dashboard → 우측 사이드바 Account ID |

> **주의**: API 토큰 생성 시 **Cloudflare Pages: Edit** 권한이 반드시 포함되어야 합니다.

### 환경 변수 (Cloudflare Pages)

Cloudflare Dashboard → Pages → dojangwan → Settings → Environment variables

| 변수 | 설명 |
|---|---|
| `JWT_SECRET` | JWT 서명 키 (최소 32자 랜덤 문자열) |

### D1 데이터베이스

```bash
# D1 DB 생성 (최초 1회)
npx wrangler d1 create dojangwan-db

# 스키마 적용
npx wrangler d1 execute dojangwan-db --file=db/schema.sql
```

## 기술 스택

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Zod, Jose (JWT), bcryptjs
- **Database**: Cloudflare D1 (SQLite)
- **배포**: Cloudflare Pages
- **모니터링**: Sentry (선택)
