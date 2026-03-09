# TKD Platform — tkd.genomic.cc

## 프로젝트 개요

태권도 WebRTC + AI 플랫폼. 3개 독립 모듈로 구성되며, 선택적 이용이 가능하다.
도메인: tkd.genomic.cc

### 모듈 구성

1. **원격 승단 심사** — 심사위원(한국)과 응시자(해외)를 WebRTC로 실시간 양방향 연결. AI가 품새 동작을 분석하여 스켈레톤 오버레이 + 점수 표시. 심사위원이 AI 채점 + 자신의 판단을 종합하여 최종 평가.
2. **사범 원격 연수** — 강사 1명이 사범/관장 최대 30명에게 원격 품새 연수. AI가 각 사범의 동작을 실시간 분석하여 강사 화면에 표시. 수련생이 아닌 사범의 역량을 올리는 구조.
3. **대회 라이브 중계 + AI 포토** — 스마트폰으로 대회 실시간 중계 + AI 얼굴인식으로 선수별 사진 자동 분류 → 학부모 메신저 전송.

### 타겟 파트너

- 국기원 (승단 심사 원격화)
- 최영석 감독 (태국 4,000개 도장, 100만 수련생 — 사범 연수)
- 이재환 사장 KBS비즈니스 (대회 중계 콘텐츠 → 방송사 납품)

## 기술 스택

- **프레임워크**: Next.js 15 (App Router) + TypeScript
- **스타일링**: Tailwind CSS
- **실시간 영상**: Cloudflare Realtime SFU (WebRTC) — $0.05/GB egress, 월 1,000GB 무료
- **AI 동작 분석**: MediaPipe Pose (브라우저 엣지 처리)
- **AI 얼굴인식**: Cloudflare R2 + 자체 얼굴인식 모델 (photo.genomic.cc 기술 재활용)
- **데이터베이스**: Cloudflare D1
- **스토리지**: Cloudflare R2
- **배포**: Cloudflare Pages
- **인증**: 통합 로그인 (genomic.cc/login 연동, .genomic.cc 쿠키)
- **메시지**: LINE API (태국) + 카카오톡 알림톡 (한국)
- **GitHub**: pensivekim/tkd-platform

## 프로젝트 구조

```
tkd-platform/
├── CLAUDE.md
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── wrangler.toml
│
├── src/
│   ├── app/
│   │   ├── layout.tsx              # 루트 레이아웃
│   │   ├── page.tsx                # 랜딩페이지 (tkd.genomic.cc)
│   │   │
│   │   ├── exam/                   # Module 1: 원격 승단 심사
│   │   │   ├── page.tsx            # 심사 목록/대시보드
│   │   │   ├── [sessionId]/
│   │   │   │   ├── examiner/       # 심사위원 화면
│   │   │   │   │   └── page.tsx
│   │   │   │   └── applicant/      # 응시자 화면
│   │   │   │       └── page.tsx
│   │   │   └── create/             # 심사 세션 생성
│   │   │       └── page.tsx
│   │   │
│   │   ├── training/               # Module 2: 사범 원격 연수
│   │   │   ├── page.tsx            # 연수 목록/대시보드
│   │   │   ├── [sessionId]/
│   │   │   │   ├── instructor/     # 강사 화면 (1명)
│   │   │   │   │   └── page.tsx
│   │   │   │   └── trainee/        # 사범 화면 (N명)
│   │   │   │       └── page.tsx
│   │   │   └── create/
│   │   │       └── page.tsx
│   │   │
│   │   ├── arena/                  # Module 3: 대회 라이브 + AI 포토
│   │   │   ├── page.tsx            # 대회 목록
│   │   │   ├── [eventId]/
│   │   │   │   ├── broadcast/      # 중계 카메라 화면
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── watch/          # 시청자 화면
│   │   │   │   │   └── page.tsx
│   │   │   │   └── photos/         # AI 포토 갤러리
│   │   │   │       └── page.tsx
│   │   │   └── create/
│   │   │       └── page.tsx
│   │   │
│   │   └── api/                    # API 라우트
│   │       ├── webrtc/
│   │       │   ├── session/route.ts    # 세션 생성/관리
│   │       │   └── signal/route.ts     # 시그널링 서버
│   │       ├── exam/route.ts           # 심사 CRUD
│   │       ├── training/route.ts       # 연수 CRUD
│   │       └── arena/route.ts          # 대회 CRUD
│   │
│   ├── components/
│   │   ├── webrtc/
│   │   │   ├── WebRTCProvider.tsx       # WebRTC 컨텍스트
│   │   │   ├── VideoGrid.tsx           # N명 영상 그리드
│   │   │   ├── PeerConnection.tsx      # P2P 연결 관리
│   │   │   └── SFUConnection.tsx       # Cloudflare SFU 연결
│   │   │
│   │   ├── ai/
│   │   │   ├── PoseOverlay.tsx         # MediaPipe 스켈레톤 오버레이
│   │   │   ├── PoseScore.tsx           # AI 동작 정확도 점수
│   │   │   └── FaceDetect.tsx          # 얼굴인식 (포토 분류용)
│   │   │
│   │   ├── exam/
│   │   │   ├── ExaminerView.tsx        # 심사위원 전용 화면
│   │   │   ├── ApplicantView.tsx       # 응시자 전용 화면
│   │   │   └── ScorePanel.tsx          # AI점수 + 심사위원 판단 패널
│   │   │
│   │   ├── training/
│   │   │   ├── InstructorView.tsx      # 강사 화면 (30명 모니터링)
│   │   │   └── TraineeView.tsx         # 사범 화면
│   │   │
│   │   ├── arena/
│   │   │   ├── BroadcastView.tsx       # 중계 카메라 화면
│   │   │   ├── WatchView.tsx           # 시청자 화면
│   │   │   └── PhotoGallery.tsx        # AI 분류 포토 갤러리
│   │   │
│   │   └── shared/
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── ModuleCard.tsx
│   │
│   ├── lib/
│   │   ├── cloudflare-sfu.ts           # Cloudflare Realtime SFU API 래퍼
│   │   ├── mediapipe-pose.ts           # MediaPipe Pose 초기화/유틸
│   │   ├── pose-scoring.ts             # 품새 동작 점수 계산 로직
│   │   ├── face-recognition.ts         # 얼굴인식 유틸
│   │   └── db.ts                       # D1 데이터베이스 래퍼
│   │
│   └── types/
│       ├── exam.ts
│       ├── training.ts
│       ├── arena.ts
│       └── webrtc.ts
│
├── db/
│   └── schema.sql                  # D1 스키마
│
└── public/
    ├── models/                     # MediaPipe 모델 파일
    └── images/
```

## Cloudflare Realtime SFU 연동 핵심

### 가격 구조 (팩트)
- Egress만 과금: $0.05/GB (서버 → 클라이언트 방향만)
- Ingress는 무료
- 월 1,000GB 무료 티어 (SFU + TURN 합산)
- SFU + TURN 동시 사용 시 중복 과금 없음
- 330+ 글로벌 PoP, Anycast 자동 라우팅

### 비용 절감 전략 (반드시 적용)

1. **사범 연수에서 코치 → 사범 방향 음성 전용**: 코치 영상을 30명에게 보내면 13.5GB지만 음성만 보내면 1.71GB. 85% 절감.
2. **Simulcast ABR**: 720p/480p/360p 3개 레이어 전송. SFU가 수신자 네트워크에 맞춰 자동 선택.
3. **엣지 AI 처리**: MediaPipe Pose는 수련생/사범 브라우저에서 직접 실행. 영상 대신 키포인트 좌표(수백 바이트)만 서버로 전송 가능.

### SFU 세션 생성 (Cloudflare API)

```typescript
// Cloudflare Realtime SFU 세션 생성
const response = await fetch(
  `https://rtc.live.cloudflare.com/v1/apps/${APP_ID}/sessions/new`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ description: 'TKD Exam Session' }),
  }
);
const { sessionId } = await response.json();
```

### 트랙 추가 (영상/음성)

```typescript
// 로컬 미디어를 SFU에 publish
const trackResponse = await fetch(
  `https://rtc.live.cloudflare.com/v1/apps/${APP_ID}/sessions/${sessionId}/tracks/new`,
  {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_TOKEN}` },
    body: JSON.stringify({
      tracks: [{
        location: 'local',
        trackName: 'video',
        // sessionDescription은 WebRTC offer에서 가져옴
      }],
    }),
  }
);
```

## MediaPipe Pose 연동

```typescript
// 브라우저에서 직접 실행 (엣지 처리)
import { Pose } from '@mediapipe/pose';

const pose = new Pose({
  locateFile: (file) => `/models/${file}`,
});

pose.setOptions({
  modelComplexity: 1,     // 0=lite, 1=full, 2=heavy
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

pose.onResults((results) => {
  // results.poseLandmarks: 33개 키포인트 좌표
  // 이 좌표를 canvas에 스켈레톤으로 그리고
  // 표준 품새 템플릿과 비교하여 점수 산출
  drawSkeleton(canvasCtx, results.poseLandmarks);
  const score = comparePose(results.poseLandmarks, templatePose);
});
```

## DB 스키마 (Cloudflare D1)

```sql
-- 심사 세션
CREATE TABLE exam_sessions (
  id TEXT PRIMARY KEY,
  examiner_id TEXT NOT NULL,
  applicant_id TEXT,
  poomsae_type TEXT,         -- 태극 1장~한수
  dan_level INTEGER,          -- 응시 단
  status TEXT DEFAULT 'waiting', -- waiting/active/completed
  ai_score REAL,
  examiner_score REAL,
  final_result TEXT,          -- pass/fail
  recording_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT
);

-- 연수 세션
CREATE TABLE training_sessions (
  id TEXT PRIMARY KEY,
  instructor_id TEXT NOT NULL,
  title TEXT,
  poomsae_type TEXT,
  max_trainees INTEGER DEFAULT 30,
  status TEXT DEFAULT 'scheduled',
  scheduled_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 연수 참가자
CREATE TABLE training_participants (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  trainee_id TEXT NOT NULL,
  trainee_name TEXT,
  dojang_name TEXT,
  avg_score REAL,
  joined_at TEXT,
  FOREIGN KEY (session_id) REFERENCES training_sessions(id)
);

-- 대회
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT,
  location TEXT,
  status TEXT DEFAULT 'upcoming',
  stream_url TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 대회 사진/영상
CREATE TABLE event_media (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  type TEXT,                -- photo/video/highlight
  r2_key TEXT NOT NULL,
  player_id TEXT,           -- AI 얼굴인식으로 매칭된 선수
  player_name TEXT,
  thumbnail_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (event_id) REFERENCES events(id)
);

-- 사용자
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,                -- examiner/instructor/trainee/player/parent
  dojang_name TEXT,
  dan_level INTEGER,
  country TEXT,
  messenger_id TEXT,        -- LINE or KakaoTalk ID
  messenger_type TEXT,      -- line/kakao
  created_at TEXT DEFAULT (datetime('now'))
);
```

## wrangler.toml

```toml
name = "tkd-platform"
compatibility_date = "2024-12-01"

[[d1_databases]]
binding = "DB"
database_name = "tkd-platform"
database_id = "<TBD>"

[[r2_buckets]]
binding = "MEDIA"
bucket_name = "tkd-media"

[vars]
CLOUDFLARE_SFU_APP_ID = "<TBD>"
```

## 개발 우선순위

### Phase 1: MVP (지금 바로)
1. 랜딩페이지 (tkd.genomic.cc) — 3개 모듈 소개
2. 원격 승단 심사 1:1 WebRTC + MediaPipe Pose 오버레이
3. D1 스키마 + 기본 API

### Phase 2: 확장
4. 사범 원격 연수 1:N SFU
5. 대회 라이브 중계 WebRTC → 시청자 브라우저
6. AI 포토 (얼굴인식 + R2 + LINE/카카오톡)

### Phase 3: 고도화
7. 품새 표준 템플릿 DB 구축 (태극 1장~한수)
8. AI 채점 알고리즘 고도화
9. HLS 전환 (대규모 시청자 대응)

## 주의사항

- **미디어리터러시 프로젝트**(media.genomic.cc)에서 Cloudflare Realtime SFU 연구를 진행한 기록이 있음. 해당 코드 참고 가능.
- Cloudflare Calls API는 현재 Realtime SFU로 리브랜딩됨. 기존 media.genomic.cc 코드에 Dyte 기반 RealtimeKit 코드가 섞여 있으니 주의.
- **WebRTC SFU와 TURN 동시 사용 시 중복 과금 없음** (Cloudflare 공식 문서 확인 완료)
- Phase 1 파일럿은 무료 티어(월 1,000GB) 내에서 운영 가능. 비용 0.
- Wrangler 4 사용 권장 (Windows libuv crash 이슈)
