# 도장관 (DOJANGWAN) CLAUDE.md

## 서비스 개요
- 서비스명: 도장관 (DOJANGWAN)
- 도메인: tkd.genomic.cc
- GitHub: pensivekim/tkd-platform
- 스택: Next.js 16 + TypeScript + Tailwind + Cloudflare Workers + D1
- 목적: 태권도 도장 전용 SaaS 플랫폼 (원생 관리 / AI 품새 채점 / 사범 마켓플레이스)

## 3-Layer 전략
- Layer 1 (B2B): 도장 SaaS — 원생 관리, 출석, 공지사항, 설정 ← **Phase 1 완료**
- Layer 2 (B2C): AI 품새 채점 — MediaPipe Pose 기반 원격 승단 심사 + 사범 연수 ← 기존 구현
- Layer 3 (B2B2C): 대회 라이브 중계 + AI 포토 + 사범 마켓플레이스 ← 기존 구현
- 핵심 Moat: 국기원 단증 연동
- 타겟: 국내 + 미국(15,000개) + 태국(4,000개) 도장

## 기술 스택
- Frontend: Next.js 16 (App Router), TypeScript, Tailwind CSS
- Backend: Next.js API Routes, Zod, Jose (JWT), bcryptjs, nanoid
- Database: Cloudflare D1 (SQLite)
- 빌드 어댑터: @opennextjs/cloudflare (Next.js 16 → Cloudflare Workers)
- 배포: Cloudflare Workers (wrangler deploy)
- 에러 추적: Sentry stub (lib/sentry.ts)

## Phase 로드맵

### ✅ Phase 1 완료 (Step 1~15) — Layer 1 도장 SaaS
| Step | 내용 | 상태 |
|------|------|------|
| 1~5 | WebRTC AI 품새채점 기반 구조 (기존 tkd-platform 흡수) | ✅ |
| 6 | 랜딩페이지 + 로그인 + /health 엔드포인트 | ✅ |
| 7 | 공통 컴포넌트 + 대시보드 레이아웃 | ✅ |
| 8 | 원생 관리 CRUD (검색·필터·모달) | ✅ |
| 9 | 출석 관리 (날짜 이동·통계·Optimistic UI) | ✅ |
| 10 | 공지사항 CRUD (고정공지 지원) | ✅ |
| 11 | 대시보드 통계 실제 데이터 연결 + 설정 페이지 | ✅ |
| 12 | 회원가입 + GitHub Actions 배포 워크플로우 | ✅ |
| 13 | D1 스키마 마이그레이션 (migrate-layer1.sql 리모트 적용 완료) | ✅ |
| 14 | Cloudflare Workers 배포 (@opennextjs/cloudflare 전환) | ✅ |
| 15 | 반응형 점검 + Phase 1 최종 정리 | ✅ |

### 🔜 Phase 2 예정 — AI 기능 + 알림톡
- 카카오 알림톡 연동 (출석 알림, 공지사항 발송)
- AI 품새 채점 대시보드 통합
- 국기원 단증 연동 API
- 원생 앱 (학부모용 출석 확인)

### 🔜 Phase 3 예정 — 마켓플레이스
- 사범 마켓플레이스
- 도장 간 대회 라이브 연동
- 멀티 도장 관리 (프랜차이즈)

## 프로젝트 구조
```
tkd-platform/
├── src/
│   ├── app/
│   │   ├── page.tsx                   # 랜딩페이지 (/register CTA)
│   │   ├── login/page.tsx             # 로그인
│   │   ├── register/page.tsx          # 회원가입 (도장+계정 동시 생성)
│   │   ├── dashboard/
│   │   │   ├── layout.tsx             # auth guard (서버 컴포넌트)
│   │   │   ├── page.tsx               # 통계 홈 (실시간 4개 카드)
│   │   │   ├── students/page.tsx      # 원생 관리
│   │   │   ├── attendance/page.tsx    # 출석 관리
│   │   │   ├── notices/page.tsx       # 공지사항
│   │   │   └── settings/page.tsx      # 도장정보·비밀번호·요금제
│   │   └── api/
│   │       ├── auth/login|register/   # 인증 API
│   │       ├── students/[id]/         # 원생 CRUD
│   │       ├── attendance/[id]/       # 출석 CRUD
│   │       ├── notices/[id]/          # 공지사항 CRUD
│   │       ├── dashboard/stats/       # 통계 API
│   │       ├── settings/dojang|password/ # 설정 API
│   │       └── health/                # 헬스체크
│   ├── components/
│   │   ├── layout/                    # DashboardShell, Sidebar
│   │   ├── ui/                        # LoadingSpinner, EmptyState, ErrorMessage
│   │   ├── students/StudentModal.tsx
│   │   └── notices/NoticeModal.tsx
│   └── lib/
│       ├── auth.ts                    # verifyJwt(), authFromRequest()
│       ├── constants.ts               # BELT_LIST, REGION_LIST, ATTENDANCE_TYPES
│       └── sentry.ts                  # captureException() stub
├── db/
│   ├── schema.sql                     # 전체 스키마 (14 테이블)
│   └── migrate-layer1.sql             # Layer 1 마이그레이션 (리모트 적용 완료)
├── open-next.config.ts                # @opennextjs/cloudflare 설정
├── wrangler.toml                      # Workers 설정
└── .github/workflows/deploy.yml      # GitHub Actions CI/CD
```

## 인증 구조
- JWT, 쿠키명: `genomic_session`, 도메인: `.genomic.cc`
- 미로그인 시 `/login` 리다이렉트 (dashboard/layout.tsx 서버 컴포넌트에서 처리)
- `authFromRequest()` → cookie → `verifyJwt()` → `JwtPayload { userId, dojanId, role, name }`

## D1 바인딩 패턴
tsconfig.json은 보호 파일이므로 `@cloudflare/workers-types` 추가 불가.
모든 D1 접근은 아래 패턴 사용:
```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = (process as any).env?.DB as any
if (!db) return Response.json({ error: 'DB를 사용할 수 없습니다.' }, { status: 503 })
```

## 배포 구조
- 빌드: `npx opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion`
- 출력: `.open-next/worker.js` + `.open-next/assets/`
- 배포: `npx wrangler@4 deploy`
- GitHub Secrets 필요: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- Workers 환경변수: `JWT_SECRET` (Cloudflare Dashboard에서 설정)

## 개발 명령어
```bash
npm run dev              # 로컬 개발
npm run build            # Next.js 빌드 검증
npm run pages:build      # opennextjs-cloudflare 빌드
npm run pages:deploy     # 빌드 + wrangler deploy

# D1
npx wrangler d1 execute tkd-platform --remote --file=db/migrate-layer1.sql
npx wrangler d1 execute tkd-platform --local --file=db/schema.sql
```

## 코딩 규칙
- 모바일 우선 (375px), sm: md: lg: 순서
- 모든 API: `try/catch + captureException()` 필수, 빈 catch 절대 금지
- API 에러 응답: `{ error: string }` 형식 통일
- D1 접근: `(process as any).env?.DB as any` 패턴 사용
- 비동기 UI: isLoading / EmptyState / ErrorMessage 3종 세트 필수
- 한글 텍스트: `style={{ wordBreak: 'keep-all' }}` 기본 적용
- 터치 버튼 모바일 최소: `py-2.5` 이상 (44px 기준)
- wrangler 4만 사용 (3.x Windows 버그)

## ⚠️ 절대 하지 말 것
- tsconfig.json 수정 금지 (보호 파일)
- wrangler.toml 임의 수정 금지 (보호 파일)
- API 키 하드코딩 금지
- 빈 catch 블록 금지
- wrangler 3.x 사용 금지
- 빈 화면 방치 금지 (로딩/빈상태/에러 UI 필수)
