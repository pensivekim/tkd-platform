# 도장관 (DOJANGWAN) CLAUDE.md

## 서비스 개요
- 서비스명: 도장관 (DOJANGWAN)
- 도메인: tkd.genomic.cc
- GitHub: pensivekim/tkd-platform
- 스택: Next.js 15 + TypeScript + Tailwind + Cloudflare Pages + D1 + R2
- 목적: 태권도 도장 전용 SaaS 플랫폼 (원생 관리 / AI 품새 채점 / 사범 마켓플레이스)

## 3-Layer 전략
- Layer 1 (B2B): 도장 SaaS — 원생 관리, 출석, 알림톡 ← 현재 개발 중
- Layer 2 (B2C): AI 품새 채점 — MediaPipe Pose 기반 원격 승단 심사 + 사범 연수 ← Step 5 완료
- Layer 3 (B2B2C): 대회 라이브 중계 + AI 포토 + 사범 마켓플레이스 ← Step 4 완료
- 핵심 Moat: 국기원 단증 연동
- 타겟: 국내 + 미국(15,000개) + 태국(4,000개) 도장
- 멀티랭귀지: 한국어 / 영어 / 태국어 / 스페인어 (i18n 구현 완료)

## 기술 스택
- Frontend: Next.js 15 (App Router), TypeScript, Tailwind CSS
- Backend: Hono (API 라우터), Zod (유효성 검사), Jose (JWT)
- Database: Cloudflare D1 (SQLite)
- Storage: Cloudflare R2
- 실시간 영상: Cloudflare Realtime SFU (WebRTC) — $0.05/GB egress, 월 1,000GB 무료
- AI 동작 분석: MediaPipe Pose (브라우저 엣지 처리)
- 알림: NHN Cloud 알림톡 (한국) / LINE API (태국)
- 에러 추적: Sentry
- 배포: Cloudflare Pages

## 프로젝트 구조
```
tkd-platform/
├── src/
│   ├── app/
│   │   ├── layout.tsx / page.tsx      # 루트 레이아웃 + 랜딩
│   │   ├── exam/                      # Layer 2: 원격 승단 심사
│   │   ├── training/                  # Layer 2: 사범 원격 연수
│   │   ├── arena/                     # Layer 3: 대회 라이브 + AI 포토
│   │   ├── poomsae/                   # Layer 2: 품새 채점 B2C
│   │   └── api/                       # API 라우트
│   ├── components/
│   │   ├── ai/                        # PoseOverlay, PoseScore
│   │   ├── exam/                      # ScorePanel
│   │   └── webrtc/                    # VideoPlayer
│   └── lib/
│       ├── constants.ts               # 띠 목록, 지역 목록 등
│       ├── sentry.ts                  # Sentry 래퍼
│       ├── db.ts                      # D1 쿼리 헬퍼
│       ├── i18n/                      # ko/en/th/es 다국어
│       ├── pose-scoring.ts            # 품새 채점 알고리즘
│       ├── poomsae-data.ts            # 품새 표준 데이터
│       ├── useWebRTC.ts               # WebRTC 훅 (1:1)
│       ├── useTrainingWebRTC.ts       # WebRTC 훅 (1:N 연수)
│       └── useBroadcastWebRTC.ts      # WebRTC 훅 (대회 중계)
├── db/
│   └── schema.sql                     # D1 스키마 (전체 테이블)
├── api/                               # 별도 Cloudflare Worker (tkd-api)
│   └── src/index.ts
└── public/
```

## 인증 구조
- JWT 기반 인증, 쿠키명: genomic_session
- 쿠키 도메인: .genomic.cc (genomic.cc 생태계 통합 로그인 대비)
- 미로그인 시 /login 으로 리다이렉트
- role: 'owner' | 'staff' | 'examiner' | 'instructor' | 'trainee'

## D1 스키마 요약 (db/schema.sql)

### Layer 1: 도장 SaaS
- dojangs: 도장 정보 (plan: free/basic/pro)
- users: 통합 계정 (SaaS 관리자 + WebRTC 참가자)
- students: 원생 정보 (belt, dan, status)
- attendance: 출석 기록 (출석/결석/조퇴)
- notices: 공지사항

### Layer 2: AI 품새 채점
- exam_sessions: 원격 승단 심사
- webrtc_signals: 1:1 WebRTC 시그널링
- training_sessions: 사범 연수 세션
- training_participants: 연수 참가자
- training_signals: 연수 WebRTC 시그널링

### Layer 3: 대회 라이브
- events: 대회 정보
- event_players: 참가 선수 (얼굴인식 데이터 포함)
- event_media: 대회 사진/영상 (R2 키)
- event_signals: 대회 WebRTC 시그널링

## Cloudflare Realtime SFU 연동 핵심

### 가격 구조
- Egress만 과금: $0.05/GB (서버 → 클라이언트 방향만)
- Ingress 무료, 월 1,000GB 무료 티어 (SFU + TURN 합산)
- SFU + TURN 동시 사용 시 중복 과금 없음

### 비용 절감 전략
1. 사범 연수: 코치 음성만 전송 (영상 → 85% 절감)
2. Simulcast ABR: 720p/480p/360p 자동 선택
3. 엣지 AI 처리: MediaPipe 좌표만 서버 전송

## 환경변수
- NEXT_PUBLIC_APP_URL: 서비스 URL
- NEXT_PUBLIC_SENTRY_DSN: Sentry DSN
- JWT_SECRET: JWT 서명 시크릿 (32자 이상)
- CLOUDFLARE_ACCOUNT_ID: Cloudflare 계정 ID
- D1_DATABASE_ID: D1 데이터베이스 ID
- R2_BUCKET_NAME: R2 버킷명 (tkd-media)
- CLOUDFLARE_SFU_APP_ID: Realtime SFU App ID
- CLOUDFLARE_SFU_API_TOKEN: Realtime SFU API Token
- NHN_CLOUD_APP_KEY: 알림톡 앱키
- NHN_CLOUD_SECRET_KEY: 알림톡 시크릿키

## 개발 명령어
```bash
npm run dev                      # 로컬 개발 서버
npm run build                    # 프로덕션 빌드
npm run pages:deploy             # Cloudflare Pages 배포
wrangler d1 execute tkd-platform --local --file=db/schema.sql  # 로컬 DB 초기화
cd api && npx wrangler deploy    # API Worker 배포
```

## 코딩 규칙
- 모바일 우선 (375px 기준, sm: md: lg: 순서)
- 모든 API: try/catch + captureException() 필수
- 빈 catch 블록 절대 금지
- API 키 하드코딩 절대 금지
- 환경변수 없으면 서버 시작 시 throw Error
- 모든 비동기: isLoading / EmptyState / ErrorMessage 처리 필수
- 한글 텍스트: word-break: keep-all 기본 적용
- Wrangler 4 사용 (3.x Windows libuv 버그 있음)
- src/ 구조 유지 (tsconfig paths: @/* → ./src/*)

## Phase 로드맵
- Phase 1 (완료): Next.js 15 기본 구조 + 랜딩페이지
- Phase 2 (완료): 원격 승단 심사 1:1 WebRTC + MediaPipe Pose
- Phase 3 (완료): i18n (ko/en/th/es) + 사범 연수 1:N WebRTC
- Phase 4 (완료): 대회 라이브 중계 + AI 포토 + 스코어보드
- Phase 5 (완료): AI 품새 채점 고도화 + B2C 경험 페이지
- Phase 6 (현재): Layer 1 도장 SaaS — 원생 관리 CRUD
- Phase 7: 출석 체크 UI
- Phase 8: 공지사항
- Phase 9: 국기원 단증 연동 + 사범 마켓플레이스

## ⚠️ 절대 하지 말 것
- API 키 하드코딩 금지
- 빈 catch 블록 금지
- 미완성을 완료로 보고 금지
- Wrangler 3.x 사용 금지
- 빈 화면 방치 금지 (로딩/빈상태/에러 UI 필수)
- src/ 구조를 app/ 루트로 변경 금지 (기존 코드 구조 유지)
