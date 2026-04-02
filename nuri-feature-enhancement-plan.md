# 누리캠퍼스 기능 고도화 기획안 v1.0

> 작성일: 2026.04  
> 현재 구현 기준: AI 튜터 채팅 + 세그먼트 6개 + 수학 OCR + Web Speech API + 12페이지 디자인  
> 이 문서는 "있는 것을 더 잘 만들기" 위한 기획안입니다.

---

## 📊 현재 구현 현황 체크리스트

| 구분 | 기능 | 상태 |
|------|------|------|
| 인프라 | Next.js 14 + TypeScript + Tailwind + shadcn/ui | ✅ 완료 |
| AI | Claude API 스트리밍 채팅 | ✅ 완료 |
| 세그먼트 | 초중고·대학생·직장인·자격증·실버·글로벌 | ✅ 완료 |
| OCR | 수학 수식 이미지 인식 (Claude Vision) | ✅ 완료 |
| TTS | Web Speech API 무료 음성 | ✅ 완료 |
| 아바타 | CSS 애니메이션 선생님 얼굴 | ✅ 완료 |
| 디자인 | STITCH 프롬프트 12페이지 | ✅ 완료 |
| 인증 | 카카오 로그인 | 🔧 미구현 |
| 결제 | TossPayments | 🔧 미구현 |
| DB | Supabase 학습 이력 | 🔧 미구현 |

---

## 🎯 기획 방향 — 3가지 축

```
UX 완성도     →  "쓰고 싶은" 앱으로
학습 효과     →  "실제로 도움되는" 앱으로  
수익 구조     →  "지속 가능한" 앱으로
```

---

---

# PART 1 — 핵심 채팅 UX 고도화

## 1-1. 스트리밍 타이핑 애니메이션 개선

### 현재 문제
- Claude 응답이 스트리밍되는 동안 글자가 갑자기 나타남
- 선생님이 "생각하는 중"인 상태 표현이 단순한 점(·) 3개

### 개선 방향

**선생님 상태 4단계 시각화**

```
IDLE       → 선생님 아바타 숨 쉬는 애니메이션 (scale 1.0↔1.008)
THINKING   → 눈이 위로 올라가는 CSS + 말풍선 "···" 페이드인
TYPING     → 글자별 opacity 0→1 (stagger 20ms)
DONE       → 체크 아이콘 + 말풍선 살짝 bounce
```

**구현 코드 방향**
```tsx
// 스트리밍 텍스트를 글자 단위로 렌더링
function StreamingText({ text }: { text: string }) {
  return (
    <span>
      {text.split('').map((char, i) => (
        <span
          key={i}
          className="inline-block animate-fade-in"
          style={{ animationDelay: `${i * 15}ms` }}
        >
          {char}
        </span>
      ))}
    </span>
  )
}
```

---

## 1-2. 대화 맥락 기억 시스템 (Session Memory)

### 현재 문제
- 같은 세션 내에서만 대화 맥락 유지
- 다음 날 접속 시 처음부터 다시 시작
- 선생님이 학생의 약점을 모름

### 개선 방향

**학생 프로필 자동 추적**

```typescript
// types/student-profile.ts
interface StudentProfile {
  userId: string
  segmentId: string
  weakAreas: string[]       // ["이차방정식 판별식", "적분 치환"]
  strongAreas: string[]
  totalSessions: number
  averageSessionMin: number
  lastLearnedAt: Date
  learningStyle: 'visual' | 'logical' | 'storytelling'
  // Claude가 분석해서 업데이트
}
```

**System Prompt에 학생 프로필 자동 주입**
```typescript
const systemPrompt = `
${course.systemPrompt}

[학생 정보]
이름: ${profile.name}
총 학습 세션: ${profile.totalSessions}회
약점 파악된 개념: ${profile.weakAreas.join(', ')}
지난번 마지막 학습: ${profile.lastLearnedAt}

이 정보를 바탕으로 학생을 기억하고 있는 것처럼 대화하세요.
예: "지난번에 판별식에서 막혔었죠? 오늘은 그 부분부터 다시 해볼까요?"
`
```

---

## 1-3. 질문 품질 향상 시스템

### 현재 문제
- 학생이 무엇을 물어봐야 할지 모름
- "잘 모르겠어요"처럼 막연한 질문이 많음

### 개선 기능: 스마트 질문 가이드

**3단계 힌트 시스템**
```
레벨 1: 빠른 질문 5개 (현재 구현됨)
레벨 2: 현재 대화 흐름 기반 다음 질문 AI 추천
레벨 3: 학습 단계별 체계적 질문 트리
```

**대화 중 실시간 추천 질문 업데이트**
```tsx
// 선생님 응답 완료 후 추천 질문 자동 갱신
async function updateSuggestedQuestions(lastTeacherMessage: string) {
  const suggestions = await fetch('/api/suggest-questions', {
    method: 'POST',
    body: JSON.stringify({ context: lastTeacherMessage, courseId })
  }).then(r => r.json())
  
  setSuggestedQuestions(suggestions.questions) // 3개 자동 업데이트
}
```

**UI: 말풍선 형태의 추천 질문 버블**
```
선생님 응답 아래에 3개의 핑크색 말풍선 버튼이 페이드인:
[판별식이 음수면 어떻게 돼요?]
[이 공식 어떻게 외워요?]
[연습문제 풀어볼게요]
```

---

## 1-4. 수식 렌더링 고도화 (KaTeX 업그레이드)

### 현재 문제
- $...$ 기본 인라인 렌더링만 구현
- 그래프나 도형 표현 불가
- 학생이 수식 복사하기 어려움

### 개선 기능

**수식 인터랙션 추가**
```tsx
// 수식 클릭 시 LaTeX 코드 복사 + 확대 보기
function MathBlock({ latex }: { latex: string }) {
  const [copied, setCopied] = useState(false)
  
  return (
    <div className="relative group">
      <BlockMath math={latex} />
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1">
        <button onClick={() => copyLatex(latex, setCopied)}>
          {copied ? '✓' : '복사'}
        </button>
        <button onClick={() => setZoomOpen(true)}>확대</button>
      </div>
    </div>
  )
}
```

**Desmos 계산기 인라인 삽입**
```tsx
// 이차함수 그래프를 대화 안에서 바로 보여주기
// Claude가 [GRAPH: y=x^2+2x+1] 태그를 출력하면 자동 렌더링
function GraphEmbed({ equation }: { equation: string }) {
  return (
    <iframe
      src={`https://www.desmos.com/calculator?eq=${encodeURIComponent(equation)}`}
      className="w-full h-64 rounded-xl border"
    />
  )
}
```

---

## 1-5. 음성 입력 추가 (STT)

### 현재 구현
- Web Speech API TTS (선생님 목소리) ✅

### 추가 기능: 학생 음성 입력 (STT)

```tsx
// Web Speech API Recognition — 무료
function VoiceInput({ onResult }: { onResult: (text: string) => void }) {
  const startListening = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
    recognition.lang = 'ko-KR'
    recognition.continuous = false
    recognition.onresult = (e) => onResult(e.results[0][0].transcript)
    recognition.start()
  }
  
  return (
    <button onClick={startListening} className="mic-button">
      🎤
    </button>
  )
}
```

**완전한 음성 대화 모드**
```
학생 🎤 말하기 → STT → 텍스트 → Claude → 응답 → TTS 재생
→ 마치 진짜 과외처럼 말로만 수업 가능
→ 실버 세그먼트에서 특히 강력한 기능
```

---

---

# PART 2 — 학습 경험 고도화

## 2-1. 학습 이력 & 오답 노트 자동 생성

### 기능 개요
모든 대화에서 AI가 자동으로 학습 포인트를 추출해 오답 노트 생성

### 데이터 흐름
```
대화 종료 → GPT 후처리 → 핵심 개념 추출 → Supabase 저장 → 오답 노트 생성
```

### DB 스키마 (Supabase)
```sql
-- 학습 세션
CREATE TABLE learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  segment_id TEXT,
  course_id TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  message_count INT DEFAULT 0,
  key_concepts TEXT[],      -- AI가 추출한 핵심 개념들
  weak_points TEXT[],       -- 틀렸거나 막힌 부분
  summary TEXT              -- 세션 요약 1-2문장
);

-- 오답 노트
CREATE TABLE mistake_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  session_id UUID REFERENCES learning_sessions,
  concept TEXT NOT NULL,    -- "이차방정식 판별식"
  question TEXT,            -- 학생이 틀린 문제
  correct_answer TEXT,      -- 정답/개념 설명
  latex_formula TEXT,       -- 관련 수식
  reviewed_count INT DEFAULT 0,
  next_review_at TIMESTAMPTZ,  -- 에빙하우스 망각 곡선 기반
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 오답 노트 UI
```
[오답 노트 카드]
┌─────────────────────────────────────┐
│ 📝 이차방정식 판별식              2025.01.15 │
│                                            │
│ ❌ 나의 오답: "판별식이 음수면 근이 없다"  │
│ ✅ 정답: D < 0이면 실근이 없고 허근 2개   │
│                                            │
│ 💡 공식: D = b²-4ac                       │
│ [수식 보기] [다시 연습하기] [완료 ✓]       │
└─────────────────────────────────────┘
```

---

## 2-2. 에빙하우스 망각 곡선 복습 시스템

### 기능 개요
틀린 개념을 최적의 타이밍에 자동 복습 알림

### 복습 스케줄 알고리즘
```typescript
// 에빙하우스 망각 곡선 기반 복습 간격
const REVIEW_INTERVALS = [
  1,    // 1일 후
  3,    // 3일 후
  7,    // 7일 후
  14,   // 14일 후
  30,   // 30일 후
  // 이후 장기 기억으로 전환
]

function calculateNextReview(reviewCount: number, lastReviewedAt: Date): Date {
  const interval = REVIEW_INTERVALS[Math.min(reviewCount, REVIEW_INTERVALS.length - 1)]
  return addDays(lastReviewedAt, interval)
}
```

### 알림 채널
```
카카오 알림톡 (최우선): "오늘 복습할 개념이 3개 있어요! 이차방정식 판별식..."
앱 내 알림 배지: 헤더에 🔴 숫자 표시
이메일 주간 리포트: 매주 월요일 "이번 주 복습 계획"
```

---

## 2-3. 학습 성취 시스템 (게임화)

### 뱃지 시스템
```typescript
const BADGES = {
  first_session:    { name: '첫 수업 완료', icon: '🎓', xp: 50 },
  streak_7:         { name: '7일 연속', icon: '🔥', xp: 200 },
  streak_30:        { name: '한 달 개근', icon: '💎', xp: 1000 },
  math_master:      { name: '수학 마스터', icon: '🔢', xp: 500 },
  ocr_50:           { name: 'OCR 달인', icon: '📸', xp: 300 },
  night_owl:        { name: '야행성 학습러', icon: '🦉', xp: 100 },
  early_bird:       { name: '아침형 학습러', icon: '🌅', xp: 100 },
  cert_pass:        { name: '합격자', icon: '🏆', xp: 2000 },
  senior_digital:   { name: '디지털 어르신', icon: '💚', xp: 300 },
}
```

### 레벨 시스템
```
Lv.1  씨앗     (0~100 XP)
Lv.2  새싹     (100~300 XP)
Lv.3  나무     (300~700 XP)
Lv.4  열매     (700~1500 XP)
Lv.5  숲       (1500~3000 XP)
Lv.6  누리인   (3000+ XP)    ← 브랜드 연계 최고 레벨
```

### 연속 학습 스트릭
```tsx
// 헤더에 항상 보이는 스트릭 카운터
<div className="streak-badge">
  🔥 <span className="font-bold">{streak}일</span> 연속
</div>
// 스트릭 끊길 때 카카오 알림: "오늘 수업 안 하시면 14일 연속 기록이 끊겨요!"
```

---

## 2-4. AI 학습 플랜 자동 생성

### 기능 개요
목표 날짜/시험일을 입력하면 AI가 맞춤 커리큘럼 설계

### 사용 흐름
```
① 학생 입력: "수능 수학 3등급 목표, D-90일"
② AI 분석: 현재 실력 진단 퀴즈 5문항
③ AI 플랜: 90일 × 일별 학습 테마 + 목표 완성도
④ 자동 스케줄: 매일 오후 7시 카카오 알림
```

### 플랜 데이터 구조
```typescript
interface LearningPlan {
  goalDescription: string    // "수능 수학 3등급"
  targetDate: Date
  daysLeft: number
  dailyGoalMinutes: number   // 하루 30분
  weeklySchedule: {
    [week: number]: {
      theme: string          // "이차방정식 완전 정복"
      courses: string[]      // 수강할 코스 ID 목록
      checkpoints: string[]  // 이번 주 목표
    }
  }
  progressPercent: number
}
```

---

## 2-5. 실시간 문제 풀기 모드 (Quiz Mode)

### 기능 개요
대화형 수업 외에 객관식/주관식 문제 풀기 모드 추가

### 3가지 퀴즈 타입
```typescript
type QuizType = 
  | 'multiple-choice'   // 4지선다 — 빠른 개념 확인
  | 'short-answer'      // 주관식 — LaTeX 또는 텍스트 입력
  | 'step-by-step'      // 풀이 과정 단계별 제출 — 핵심 기능

// Step-by-step: 학생이 한 단계씩 풀이 제출 → AI가 각 단계 피드백
// "1단계에서 부호를 잘못 처리했어요. 다시 해볼까요?"
```

### UI 설계
```
[문제 카드]
┌─────────────────────────────────────────┐
│ 문제 3/10                  ⏱ 02:34      │
│─────────────────────────────────────────│
│ 다음 이차방정식의 근을 구하시오.        │
│ x² + 5x + 6 = 0                        │
│                                         │
│ ① x = -2, x = -3   ← 정답 시 초록색   │
│ ② x = 2, x = 3                         │
│ ③ x = -2, x = 3                        │
│ ④ x = 1, x = 6                         │
│                                         │
│ [선택하기] [힌트 보기] [건너뛰기]       │
└─────────────────────────────────────────┘
```

---

---

# PART 3 — 세그먼트별 특화 기능

## 3-1. 자격증 세그먼트 — D-Day 합격 시스템

### 기능 목록

**시험 일정 등록 & D-Day 추적**
```tsx
// 헤더에 항상 보이는 D-Day 카운터
<div className="d-day-badge" style={{ background: dDay < 30 ? '#FCEBEB' : '#EAF3DE' }}>
  📅 공인중개사 D-{dDay}
</div>
```

**합격 예측 AI 진단**
```
매주 모의고사 20문항 → 정답률 분석 → "현재 페이스라면 합격 확률 67%"
→ 취약 과목 집중 플랜 자동 재조정
```

**기출문제 자동 생성**
```typescript
// Claude로 실제 기출 유형과 동일한 문제 생성
const generatedQuestion = await anthropic.messages.create({
  system: `당신은 ${certName} 기출문제 전문 출제자입니다.
  실제 시험과 동일한 난이도와 형식으로 문제를 생성하세요.`,
  messages: [{ role: 'user', content: `${topic} 관련 4지선다 문제 1개 생성` }]
})
```

---

## 3-2. 실버 세그먼트 — 가족 연동 시스템

### 기능: 자녀가 부모님 학습 현황 모니터링

```typescript
// 가족 연동 구조
interface FamilyLink {
  parentUserId: string
  childUserId: string        // 결제하는 자녀
  notificationLevel: 'all' | 'weekly' | 'milestone'
  weeklyReportEnabled: boolean
}
```

**자녀에게 보내는 주간 리포트 카카오 메시지**
```
[누리캠퍼스] 부모님 학습 리포트
──────────────────
이번 주 부모님 학습 현황:
✅ 수업 4회 완료
📱 스마트폰 기초 75% 달성
🏆 "첫 수업 완료" 뱃지 획득!

부모님이 정말 열심히 하고 계세요 💚
[앱에서 응원 메시지 보내기]
```

**실버 전용 UI 옵션**
```typescript
// 세그먼트가 'silver'면 자동 적용
const SILVER_UI_CONFIG = {
  fontSize: '22px',          // 큰 글씨
  buttonMinHeight: '60px',   // 큰 버튼
  animationSpeed: 'slow',    // 느린 전환
  autoPlayTTS: true,         // 자동 음성 재생
  repeatButton: true,        // "다시 말해줘" 버튼 항상 표시
  highContrast: false,       // 옵션으로 제공
}
```

---

## 3-3. 글로벌 한국어 세그먼트 — 발음 교정 AI

### 기능: STT → 한국어 발음 분석

```typescript
// 학생이 한국어로 말하면 → 발음 교정 피드백
async function analyzePronunciation(audioText: string, targetText: string) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    system: '당신은 한국어 발음 교정 전문가입니다.',
    messages: [{
      role: 'user',
      content: `
학생이 말한 내용: "${audioText}"
목표 발음: "${targetText}"

1. 발음이 맞는지 평가 (90점 만점)
2. 틀린 부분 지적 (ㅗ/ㅓ 혼동 등)
3. 개선 팁 1줄
JSON 형식으로만 응답`
    }]
  })
  return JSON.parse(response.content[0].text)
}
```

**K-콘텐츠 연계 학습**
```
드라마 장면 → 대사 듣기 → 따라 말하기 → 발음 점수 → 다음 장면
"오징어 게임 EP1, 1분 30초 장면으로 한국어 배우기"
```

---

## 3-4. 직장인 세그먼트 — 실무 시뮬레이션

### 기능: 역할극(Role-play) 수업 모드

```typescript
// 직장인 롤플레이 시나리오 타입
type WorkScenario =
  | 'email-writing'       // 이메일 작성
  | 'meeting-english'     // 영어 회의
  | 'report-review'       // 보고서 첨삭
  | 'interview-prep'      // 면접 준비
  | 'negotiation'         // 협상 롤플레이

// 예: 영어 회의 시나리오
const meetingRoleplay = `
당신은 지금부터 완전히 원어민 미국인 동료 "David"입니다.
한국어를 전혀 모르는 척 하세요.
학생이 영어로 회의를 진행합니다.
발음보다 유창성을 먼저 칭찬하고, 이후 자연스럽게 교정하세요.
`
```

**업무 서류 즉석 첨삭**
```
학생이 보고서 붙여넣기 → AI가 즉시 개선안 제시
"3번째 문단: '검토 결과 ~하겠습니다' → '검토한 결과, ~를 제안드립니다'로 수정"
변경 사항 diff 형태로 강조 표시
```

---

---

# PART 4 — 결제 & 수익 시스템

## 4-1. TossPayments 결제 통합

### 결제 플로우
```
1. 요금제 선택
2. TossPayments 결제창 팝업
3. 결제 완료 → Webhook → DB 구독 상태 업데이트
4. 환영 메시지 + 첫 수업 바로 시작
```

### 구독 관리 API
```typescript
// /app/api/payments/route.ts
import { tossPayments } from '@tosspayments/tosspayments-sdk'

export async function POST(req: Request) {
  const { orderId, amount, customerKey } = await req.json()
  
  const response = await tossPayments.billing.authorizeCard({
    customerKey,
    authKey: req.headers.get('toss-auth-key')!,
  })
  
  // 구독 생성 (월/연간)
  await createSubscription({
    userId: customerKey,
    planId: req.body.planId,
    billingKey: response.billingKey,
    nextBillingAt: addMonths(new Date(), 1)
  })
}
```

### 요금제 구조
```
무료 체험  : 7일 전 기능, 카드 등록 불필요
베이직     : ₩9,900/월 | ₩89,000/년 (2개월 무료)
프로       : ₩24,900/월 | ₩219,000/년
기업       : 맞춤 견적 (10인 이상)
```

---

## 4-2. 무료 → 유료 전환 퍼널 최적화

### 전환 트리거 포인트

**자연스러운 페이월 설계**
```
시나리오 1: 무료 체험 5회 소진 시
  → "오늘 질문 횟수를 모두 사용했어요"
  → "베이직으로 업그레이드하면 무제한으로 질문할 수 있어요"
  → [지금 업그레이드] [내일 다시오기]

시나리오 2: 좋은 학습 경험 직후 (뱃지 획득 시)
  → "🎉 첫 수업 완료! 정말 잘 하셨어요"
  → "앞으로 계속 이어가려면 베이직을 시작해보세요"
  → [7일 더 무료로] [지금 시작]

시나리오 3: 오답 노트 2개 쌓인 시점
  → "오답 노트가 2개 쌓였어요! 복습 알림 기능을 활성화해보세요"
  → 유료 기능 미리보기
```

---

---

# PART 5 — 마케팅 & 성장 기능

## 5-1. 카카오 알림톡 통합

### 알림 시나리오 목록

```typescript
const KAKAO_MESSAGES = {
  // 학습 독려
  daily_reminder: (name: string, streak: number) =>
    `${name}님, 오늘 수업 하셨나요? 🔥 ${streak}일 연속 기록을 지켜주세요!`,
  
  // 오답 복습
  review_reminder: (concept: string) =>
    `잊기 전에 복습하세요! "${concept}" 개념을 다시 확인해볼 시간이에요.`,
  
  // D-Day 알림 (자격증)
  dday_alert: (exam: string, days: number) =>
    `📅 ${exam} 시험까지 D-${days}일! 오늘 목표를 확인해보세요.`,
  
  // 친구 초대 (바이럴)
  referral_success: (referrerName: string) =>
    `${referrerName}님이 초대한 친구가 가입했어요! 한 달 무료 혜택이 지급됩니다 🎁`,
  
  // 가족 리포트 (실버)
  family_report: (parentName: string, sessions: number) =>
    `${parentName}께서 이번 주 ${sessions}번 공부하셨어요 💚 앱에서 응원해드려요!`,
}
```

---

## 5-2. 친구 초대 바이럴 시스템

### 인센티브 구조
```
초대자 혜택: 친구 1명 가입 시 → 1개월 무료 (최대 6개월)
피초대자 혜택: 가입 시 무료 체험 14일 (기본 7일 → 2배)
```

### 초대 링크 생성
```typescript
// 카카오 공유용 초대 링크 자동 생성
async function generateReferralLink(userId: string) {
  const code = generateShortCode(userId)  // "ABC123"
  await supabase.from('referrals').insert({ userId, code })
  
  return {
    url: `https://nuri.ai/signup?ref=${code}`,
    kakaoShareData: {
      title: '누리캠퍼스 AI 선생님과 함께해요!',
      description: '초대 링크로 가입하면 14일 무료!',
      imageUrl: 'https://nuri.ai/og-image.png',
    }
  }
}
```

---

## 5-3. SEO & 콘텐츠 마케팅 자동화

### 학습 콘텐츠 자동 블로그 생성

```typescript
// 인기 질문 TOP 50 → SEO 블로그 포스트 자동 생성
// 예: "이차방정식 근의 공식 완전 정복" → 구글 검색 상위 노출
async function generateBlogPost(topic: string, segment: string) {
  const content = await anthropic.messages.create({
    system: 'SEO 최적화 교육 블로그 포스트 작성 전문가',
    messages: [{
      role: 'user',
      content: `
주제: ${topic}
세그먼트: ${segment}
키워드: [관련 검색 키워드 포함]
길이: 2000자
형식: 마크다운
포함사항: 개념 설명, 예제, 자주 묻는 질문 3개
      `
    }]
  })
  
  // Next.js Static Pages로 자동 빌드
  await generateStaticPage(`/learn/${slug}`, content)
}
```

---

---

# PART 6 — 관리자 & 운영 도구

## 6-1. 어드민 대시보드 (Next.js Admin)

### 주요 지표 모니터링
```
실시간 지표:
  - 현재 접속자 수 / 진행 중인 수업 수
  - 분당 API 호출 수 (비용 추적)
  - 에러율 / 응답 속도

일간 지표:
  - 신규 가입자 / 이탈자
  - 세그먼트별 활성 유저
  - 결제 전환율 / MRR 변화
  - 가장 많이 질문된 개념 TOP 10
```

### 콘텐츠 관리
```typescript
// segments.ts config를 DB로 이전 → 어드민에서 코드 없이 수정
// 새 코스 추가: 어드민 UI에서 폼 작성 → DB 저장 → 즉시 반영
interface CourseManagement {
  createCourse(data: CourseFormData): Promise<void>
  updateSystemPrompt(courseId: string, prompt: string): Promise<void>
  toggleCourseHot(courseId: string): Promise<void>
  previewSystemPrompt(prompt: string): Promise<string>  // 즉시 테스트
}
```

---

## 6-2. A/B 테스트 시스템

### 테스트할 변수들
```
① 온보딩 플로우: 세그먼트 선택 먼저 vs 체험 먼저
② 가격 표시: 월간 기준 vs 일일 기준 (₩330/일)
③ 첫 질문: AI가 먼저 질문 vs 학생이 먼저
④ 알림 타이밍: 저녁 7시 vs 9시
⑤ CTA 문구: "무료로 시작" vs "7일 무료 체험"
```

```typescript
// 미들웨어에서 A/B 그룹 자동 할당
export function middleware(req: NextRequest) {
  const variant = Math.random() < 0.5 ? 'A' : 'B'
  const response = NextResponse.next()
  response.cookies.set('ab_variant', variant)
  return response
}
```

---

---

# PART 7 — 기술 부채 & 안정성

## 7-1. 에러 처리 & 폴백 전략

### 현재 문제
- Claude API 오류 시 빈 화면
- OCR 실패 시 단순 에러 메시지

### 개선 전략
```typescript
// 계층별 폴백 (Graceful Degradation)
async function getAIResponse(messages: Message[], courseId: string) {
  try {
    // 1순위: Claude Sonnet 4
    return await callClaude('claude-sonnet-4-20250514', messages)
  } catch (primaryError) {
    try {
      // 2순위: Claude Haiku (빠른 경량 모델)
      return await callClaude('claude-haiku-4-5-20251001', messages)
    } catch (fallbackError) {
      // 3순위: 캐시된 유사 응답 반환
      return await getCachedSimilarResponse(messages)
    }
  }
}
```

### 에러 상태 UI
```
API 오류: "선생님이 잠깐 바빠요. 30초 후 자동으로 다시 시도할게요."
         + 진행 바 애니메이션 (30초 카운트다운)
         
OCR 실패: "수식을 인식하지 못했어요. 더 밝은 곳에서 다시 찍어보시겠어요?"
          + 직접 텍스트 입력 폼 자동 활성화
```

---

## 7-2. 성능 최적화

### 이미지 & 미디어
```typescript
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    sizes: [320, 480, 640, 750, 828],
  },
}

// 선생님 아바타 이미지를 CDN 캐시 (CloudFront)
// 자주 쓰는 수식 LaTeX를 SVG로 Pre-render 캐시
```

### API 응답 캐싱
```typescript
// 동일한 질문에 동일한 Claude 응답이면 캐시 히트
// Redis에 질문 해시 → 응답 저장 (24시간 TTL)
const cacheKey = `response:${courseId}:${hashQuestion(userMessage)}`
const cached = await redis.get(cacheKey)
if (cached) return JSON.parse(cached)
```

---

---

# PART 8 — 구현 우선순위 로드맵

## 즉시 (이번 주)
```
P0 — 반드시 먼저:
  □ 카카오 로그인 구현 (사용자 인증 없으면 모든 기능이 무의미)
  □ Supabase 학습 이력 저장 (세션 저장 없으면 리텐션 불가)
  □ TossPayments 결제 (수익화 없으면 지속 불가)
```

## 2주 내
```
P1 — 핵심 UX:
  □ 선생님 상태 4단계 시각화
  □ 세션 메모리 (학생 프로필 추적)
  □ 추천 질문 자동 업데이트
  □ 오답 노트 자동 생성
  □ 학습 연속 스트릭 + 뱃지
```

## 1개월 내
```
P2 — 성장 기능:
  □ 카카오 알림톡 연동
  □ 친구 초대 시스템
  □ D-Day 자격증 합격 시스템
  □ 실버 가족 연동
  □ 음성 입력(STT) 추가
```

## 2-3개월 내
```
P3 — 고도화:
  □ 에빙하우스 복습 시스템
  □ Quiz Mode (문제 풀기)
  □ AI 학습 플랜 자동 생성
  □ Desmos 그래프 인라인 삽입
  □ 어드민 대시보드
  □ A/B 테스트 인프라
```

---

## 📌 기술 부채 정리 우선순위

```
즉시 해결:
  □ any 타입 제거 → 전체 strict 타입 점검
  □ API Route에 rate limiting 추가 (DoS 방지)
  □ 환경변수 검증 로직 추가 (.env 누락 시 명확한 에러)

단기 해결:
  □ 에러 바운더리 컴포넌트 추가
  □ Sentry 에러 트래킹 연동
  □ 로딩 스켈레톤 전 페이지 적용

중기 해결:
  □ E2E 테스트 (Playwright)
  □ CI/CD 파이프라인 (GitHub Actions)
  □ 모니터링 대시보드 (Vercel Analytics)
```

---

*이 기획안은 현재 구현된 누리캠퍼스 코드베이스를 기반으로 작성되었습니다.*  
*Claude Code에 각 섹션을 개별 프롬프트로 전달하면 바로 구현 가능합니다.*
