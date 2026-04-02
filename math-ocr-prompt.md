# 수학 OCR 채팅 통합 — Claude Code 안티그래비티 프롬프트

---

## 🎯 미션

누리캠퍼스 AI 튜터 채팅창에 **수학 수식 OCR 기능**을 추가한다.
학생이 교과서·노트 사진을 찍으면 → 수식을 자동 인식하고 → 선생님 AI가 즉시 설명한다.
기존 채팅 코드는 최소한으로만 수정하고, 새 파일 추가 중심으로 구현한다.

---

## 📐 기존 스택 (변경 금지)

```
Framework:  Next.js 14 (App Router)
Language:   TypeScript (strict mode)
Styling:    Tailwind CSS + shadcn/ui
AI:         Anthropic Claude API (claude-sonnet-4-20250514)
State:      Zustand
```

---

## 📦 새로 설치할 패키지

아래 명령어를 먼저 실행하라.

```bash
npm install katex react-katex
npm install react-sketch-canvas
npm install @types/katex --save-dev
```

---

## 🗂️ 생성·수정할 파일 목록

```
신규 생성:
src/
├── app/api/math-ocr/route.ts          ← OCR API 엔드포인트
├── components/tutor/
│   ├── MathInput.tsx                   ← 카메라/파일 업로드 버튼
│   ├── MathRenderer.tsx                ← LaTeX → KaTeX 렌더러
│   ├── MathDrawPad.tsx                 ← 손으로 수식 그리기 패드
│   └── OcrPreviewBubble.tsx            ← OCR 결과 미리보기 말풍선
├── lib/
│   ├── image-to-base64.ts              ← 이미지 → Base64 유틸
│   └── latex-parser.ts                 ← LaTeX 파싱·정제 유틸
└── types/math.ts                       ← 수학 관련 타입 정의

기존 수정 (최소):
src/components/tutor/ChatInterface.tsx  ← MathInput 버튼 추가만
src/components/tutor/MessageBubble.tsx  ← MathRenderer 적용만
```

---

## ⚙️ STEP 1 — 타입 정의 (`types/math.ts`)

```typescript
export interface MathOcrResult {
  latex: string           // 인식된 LaTeX 수식
  confidence: number      // 0-1, 인식 신뢰도
  imagePreviewUrl: string // 업로드한 이미지 미리보기 URL
  rawText?: string        // 수식 외 텍스트 (있으면)
}

export interface MathMessage {
  type: 'math'
  latex: string
  imagePreviewUrl: string
  userText?: string       // 학생이 추가로 입력한 텍스트
}

// 채팅 메시지 확장 (기존 Message 타입에 union 추가)
export type MessageContent =
  | { type: 'text'; text: string }
  | MathMessage
```

---

## ⚙️ STEP 2 — 이미지 유틸 (`lib/image-to-base64.ts`)

```typescript
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // "data:image/jpeg;base64,..." 에서 base64 부분만 추출
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function getImageMimeType(file: File): string {
  // 지원 형식: jpeg, png, gif, webp
  const supported = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  return supported.includes(file.type) ? file.type : 'image/jpeg'
}

export async function resizeImageIfNeeded(file: File, maxSizeMB = 4): Promise<File> {
  // Claude API 이미지 크기 제한: 5MB. 여유있게 4MB로 제한
  if (file.size <= maxSizeMB * 1024 * 1024) return file

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = Math.sqrt((maxSizeMB * 1024 * 1024) / file.size)
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        blob => resolve(new File([blob!], file.name, { type: 'image/jpeg' })),
        'image/jpeg', 0.85
      )
    }
    img.src = URL.createObjectURL(file)
  })
}
```

---

## ⚙️ STEP 3 — LaTeX 파싱 유틸 (`lib/latex-parser.ts`)

```typescript
export function cleanLatex(raw: string): string {
  return raw
    .trim()
    // Claude가 백틱으로 감싸서 줄 때 제거
    .replace(/^```latex\n?/, '').replace(/\n?```$/, '')
    .replace(/^`/, '').replace(/`$/, '')
    // 불필요한 \displaystyle 제거 (KaTeX가 자동 처리)
    .replace(/^\\displaystyle\s*/, '')
    .trim()
}

// 텍스트에서 $...$ 와 $$...$$ 구간을 분리
export function parseLatexSegments(text: string): Array<
  | { type: 'text'; content: string }
  | { type: 'inline'; latex: string }
  | { type: 'block'; latex: string }
> {
  const segments: ReturnType<typeof parseLatexSegments> = []
  // $$...$$ 블록 수식 먼저 처리 (인라인보다 우선)
  const blockRe = /\$\$([\s\S]*?)\$\$/g
  const inlineRe = /\$((?:[^$\\]|\\.)*?)\$/g

  let lastIndex = 0
  const combined = /(\$\$[\s\S]*?\$\$|\$(?:[^$\\]|\\.)*?\$)/g
  let match: RegExpExecArray | null

  while ((match = combined.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    const raw = match[0]
    if (raw.startsWith('$$')) {
      segments.push({ type: 'block', latex: raw.slice(2, -2).trim() })
    } else {
      segments.push({ type: 'inline', latex: raw.slice(1, -1).trim() })
    }
    lastIndex = match.index + raw.length
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return segments
}
```

---

## ⚙️ STEP 4 — OCR API Route (`app/api/math-ocr/route.ts`)

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { cleanLatex } from '@/lib/latex-parser'

export const runtime = 'nodejs'
export const maxDuration = 30  // OCR은 최대 30초 허용

export async function POST(req: Request) {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = await req.json()

    if (!imageBase64) {
      return Response.json({ error: 'imageBase64 is required' }, { status: 400 })
    }

    const anthropic = new Anthropic()

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `이 이미지에서 수학 수식을 찾아 LaTeX 형식으로 변환하세요.

규칙:
1. 수식만 LaTeX로 출력하고 설명은 쓰지 마세요
2. 수식이 여러 개면 각각 새 줄로 구분하세요
3. 손글씨라도 최대한 정확하게 인식하세요
4. 분수는 \\frac{}{}, 제곱근은 \\sqrt{}, 그리스 문자는 \\alpha, \\beta 등으로
5. 수식이 없으면 "NO_MATH"라고만 출력하세요

출력 예시:
x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}`,
            },
          ],
        },
      ],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''

    if (rawText.trim() === 'NO_MATH') {
      return Response.json({ latex: '', confidence: 0, hasNoMath: true })
    }

    const latex = cleanLatex(rawText)

    // 신뢰도: LaTeX 특수문자 비율로 간이 계산
    const specialChars = (latex.match(/\\[a-zA-Z]+|[{}^_]/g) || []).length
    const confidence = Math.min(0.99, Math.max(0.5, specialChars / 10))

    return Response.json({ latex, confidence, hasNoMath: false })
  } catch (error) {
    console.error('Math OCR error:', error)
    return Response.json({ error: 'OCR 처리 중 오류가 발생했습니다' }, { status: 500 })
  }
}
```

---

## ⚙️ STEP 5 — KaTeX 렌더러 (`components/tutor/MathRenderer.tsx`)

```typescript
'use client'

import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'
import { parseLatexSegments } from '@/lib/latex-parser'

interface Props {
  text: string
  className?: string
}

export function MathRenderer({ text, className }: Props) {
  const segments = parseLatexSegments(text)

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.type === 'block') {
          return (
            <span key={i} className="block my-3 overflow-x-auto">
              <BlockMath
                math={seg.latex}
                errorColor="#E24B4A"
                renderError={(err) => (
                  <span className="text-red-500 text-xs font-mono">{seg.latex}</span>
                )}
              />
            </span>
          )
        }
        if (seg.type === 'inline') {
          return (
            <InlineMath
              key={i}
              math={seg.latex}
              errorColor="#E24B4A"
              renderError={() => (
                <code className="text-xs bg-purple-50 text-purple-800 px-1 rounded">
                  {seg.latex}
                </code>
              )}
            />
          )
        }
        // 일반 텍스트: 줄바꿈 처리
        return (
          <span key={i}>
            {seg.content.split('\n').map((line, j) => (
              <span key={j}>
                {line}
                {j < seg.content.split('\n').length - 1 && <br />}
              </span>
            ))}
          </span>
        )
      })}
    </span>
  )
}
```

---

## ⚙️ STEP 6 — OCR 미리보기 말풍선 (`components/tutor/OcrPreviewBubble.tsx`)

```typescript
'use client'

import Image from 'next/image'
import { InlineMath } from 'react-katex'
import 'katex/dist/katex.min.css'

interface Props {
  imagePreviewUrl: string
  latex: string
  isProcessing: boolean
  onConfirm: (latex: string, userText: string) => void
  onRetry: () => void
  onCancel: () => void
}

export function OcrPreviewBubble({
  imagePreviewUrl,
  latex,
  isProcessing,
  onConfirm,
  onRetry,
  onCancel,
}: Props) {
  const [userText, setUserText] = useState('')

  if (isProcessing) {
    return (
      <div className="flex items-center gap-3 bg-purple-50 rounded-2xl rounded-tl-sm p-4 max-w-xs">
        <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
          <Image src={imagePreviewUrl} alt="업로드" width={32} height={32} className="object-cover" />
        </div>
        <div>
          <div className="text-sm text-purple-700 font-medium">수식 인식 중...</div>
          <div className="flex gap-1 mt-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-purple-100 rounded-2xl rounded-tl-sm p-4 max-w-sm shadow-sm">
      {/* 이미지 썸네일 */}
      <div className="relative w-full h-24 rounded-lg overflow-hidden mb-3 bg-gray-50">
        <Image src={imagePreviewUrl} alt="수식 사진" fill className="object-contain" />
      </div>

      {/* 인식된 수식 */}
      <div className="bg-purple-50 rounded-lg p-3 mb-3">
        <div className="text-xs text-purple-500 mb-1">인식된 수식</div>
        <div className="text-center py-1 overflow-x-auto">
          {latex ? (
            <InlineMath math={latex} />
          ) : (
            <span className="text-gray-400 text-sm">수식을 인식하지 못했어요</span>
          )}
        </div>
        <div className="text-xs text-gray-400 font-mono mt-1 truncate">{latex}</div>
      </div>

      {/* 추가 질문 입력 */}
      <input
        type="text"
        placeholder="추가 질문 (선택사항)"
        value={userText}
        onChange={e => setUserText(e.target.value)}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-3 outline-none focus:border-purple-400"
        onKeyDown={e => e.key === 'Enter' && latex && onConfirm(latex, userText)}
      />

      {/* 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={() => latex && onConfirm(latex, userText)}
          disabled={!latex}
          className="flex-1 bg-purple-600 text-white text-sm rounded-lg py-2 disabled:opacity-40 hover:bg-purple-700 transition-colors"
        >
          이 수식으로 질문하기
        </button>
        <button
          onClick={onRetry}
          className="px-3 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50"
        >
          재시도
        </button>
        <button
          onClick={onCancel}
          className="px-3 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
```

---

## ⚙️ STEP 7 — 손글씨 드로잉 패드 (`components/tutor/MathDrawPad.tsx`)

```typescript
'use client'

import { useRef, useState } from 'react'
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas'

interface Props {
  onSubmit: (imageDataUrl: string) => void
  onClose: () => void
}

export function MathDrawPad({ onSubmit, onClose }: Props) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null)
  const [strokeColor, setStrokeColor] = useState('#1A1A2E')

  const handleSubmit = async () => {
    const dataUrl = await canvasRef.current?.exportImage('png')
    if (dataUrl) onSubmit(dataUrl)
  }

  return (
    // 모달 오버레이 — position:fixed 대신 부모 relative + absolute 사용
    <div className="absolute inset-0 bg-black/30 flex items-end justify-center z-50 rounded-2xl">
      <div className="bg-white w-full rounded-t-2xl p-4 shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">수식 직접 그리기</span>
          <div className="flex gap-2">
            <button
              onClick={() => canvasRef.current?.clearCanvas()}
              className="text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1"
            >
              지우기
            </button>
            <button
              onClick={() => canvasRef.current?.undo()}
              className="text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1"
            >
              되돌리기
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
        </div>

        {/* 캔버스 */}
        <div className="border-2 border-dashed border-purple-200 rounded-xl overflow-hidden mb-3 bg-gray-50">
          <ReactSketchCanvas
            ref={canvasRef}
            width="100%"
            height="200px"
            strokeWidth={3}
            strokeColor={strokeColor}
            backgroundColor="white"
            style={{ border: 'none' }}
          />
        </div>

        {/* 색상 선택 */}
        <div className="flex gap-2 mb-3">
          {['#1A1A2E', '#7F77DD', '#1D9E75', '#D85A30'].map(c => (
            <button
              key={c}
              onClick={() => setStrokeColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition-all ${
                strokeColor === c ? 'border-gray-400 scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* 제출 버튼 */}
        <button
          onClick={handleSubmit}
          className="w-full bg-purple-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          수식 인식하기 →
        </button>
      </div>
    </div>
  )
}
```

---

## ⚙️ STEP 8 — 카메라 버튼 컴포넌트 (`components/tutor/MathInput.tsx`)

```typescript
'use client'

import { useRef, useState } from 'react'
import { fileToBase64, getImageMimeType, resizeImageIfNeeded } from '@/lib/image-to-base64'
import { MathOcrResult } from '@/types/math'

interface Props {
  onOcrStart: (previewUrl: string) => void
  onOcrComplete: (result: MathOcrResult) => void
  onOcrError: (error: string) => void
  onDrawPadOpen: () => void
  disabled?: boolean
}

export function MathInput({
  onOcrStart,
  onOcrComplete,
  onOcrError,
  onDrawPadOpen,
  disabled,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  const processFile = async (file: File) => {
    // 크기 초과 시 리사이즈
    const resized = await resizeImageIfNeeded(file)
    const previewUrl = URL.createObjectURL(resized)

    // 처리 시작 알림
    onOcrStart(previewUrl)

    try {
      const base64 = await fileToBase64(resized)
      const mimeType = getImageMimeType(resized)

      const response = await fetch('/api/math-ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'OCR 실패')
      if (data.hasNoMath) throw new Error('수식을 찾을 수 없어요. 수식이 있는 부분을 다시 촬영해주세요.')

      onOcrComplete({
        latex: data.latex,
        confidence: data.confidence,
        imagePreviewUrl: previewUrl,
      })
    } catch (err) {
      onOcrError(err instanceof Error ? err.message : 'OCR 오류')
    }
  }

  const handlePaste = (e: ClipboardEvent) => {
    const items = Array.from(e.clipboardData?.items || [])
    const imageItem = items.find(item => item.type.startsWith('image/'))
    if (imageItem) {
      const file = imageItem.getAsFile()
      if (file) processFile(file)
    }
  }

  // 클립보드 붙여넣기 이벤트 등록은 ChatInterface에서 처리

  return (
    <div className="flex gap-1">
      {/* 카메라 버튼 */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) processFile(file)
          e.target.value = '' // 같은 파일 재선택 가능하게
        }}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={disabled}
        title="수식 사진 찍기 (카메라)"
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 transition-all disabled:opacity-40"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </button>

      {/* 갤러리 버튼 */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        id="gallery-input"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) processFile(file)
        }}
      />
      <button
        onClick={() => document.getElementById('gallery-input')?.click()}
        disabled={disabled}
        title="갤러리에서 선택"
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 transition-all disabled:opacity-40"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      </button>

      {/* 드로잉 패드 버튼 */}
      <button
        onClick={onDrawPadOpen}
        disabled={disabled}
        title="수식 직접 그리기"
        className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 transition-all disabled:opacity-40"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
    </div>
  )
}
```

---

## ⚙️ STEP 9 — ChatInterface 수정 (최소 변경)

기존 `ChatInterface.tsx` 에서 아래 내용만 추가하라. 기존 로직은 건드리지 말 것.

```typescript
// 1. import 추가 (파일 맨 위)
import { MathInput } from './MathInput'
import { MathDrawPad } from './MathDrawPad'
import { OcrPreviewBubble } from './OcrPreviewBubble'
import { MathOcrResult } from '@/types/math'

// 2. state 추가 (컴포넌트 내부)
const [ocrState, setOcrState] = useState<{
  status: 'idle' | 'processing' | 'preview'
  previewUrl: string
  result: MathOcrResult | null
}>({ status: 'idle', previewUrl: '', result: null })
const [showDrawPad, setShowDrawPad] = useState(false)

// 3. OCR 핸들러 추가
const handleOcrStart = (previewUrl: string) => {
  setOcrState({ status: 'processing', previewUrl, result: null })
}

const handleOcrComplete = (result: MathOcrResult) => {
  setOcrState({ status: 'preview', previewUrl: result.imagePreviewUrl, result })
}

const handleOcrError = (error: string) => {
  setOcrState({ status: 'idle', previewUrl: '', result: null })
  // 기존 toast/알림 시스템으로 에러 표시
}

const handleOcrConfirm = (latex: string, userText: string) => {
  // OCR 결과를 기존 채팅 메시지로 전송
  const messageText = userText
    ? `[수식 질문]\n$$${latex}$$\n\n${userText}`
    : `[수식 질문]\n$$${latex}$$\n\n이 수식을 설명해주세요.`

  // 기존 sendMessage 함수 호출 (변경 없음)
  sendMessage(messageText)
  setOcrState({ status: 'idle', previewUrl: '', result: null })
}

// 4. 드로잉 패드 → OCR 연결
const handleDrawSubmit = async (imageDataUrl: string) => {
  setShowDrawPad(false)
  // data:image/png;base64,... 형식에서 base64만 추출
  const base64 = imageDataUrl.split(',')[1]
  const previewUrl = imageDataUrl

  handleOcrStart(previewUrl)

  const response = await fetch('/api/math-ocr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: base64, mimeType: 'image/png' }),
  })

  const data = await response.json()
  if (data.latex) {
    handleOcrComplete({
      latex: data.latex,
      confidence: data.confidence,
      imagePreviewUrl: previewUrl,
    })
  } else {
    handleOcrError('수식을 인식하지 못했습니다.')
  }
}

// 5. JSX에 추가 — 기존 input 행 위에 OCR 미리보기
// (기존 채팅 입력창 바로 위에 삽입)
{ocrState.status !== 'idle' && (
  <OcrPreviewBubble
    imagePreviewUrl={ocrState.previewUrl}
    latex={ocrState.result?.latex ?? ''}
    isProcessing={ocrState.status === 'processing'}
    onConfirm={handleOcrConfirm}
    onRetry={() => setOcrState({ status: 'idle', previewUrl: '', result: null })}
    onCancel={() => setOcrState({ status: 'idle', previewUrl: '', result: null })}
  />
)}

{showDrawPad && (
  <MathDrawPad
    onSubmit={handleDrawSubmit}
    onClose={() => setShowDrawPad(false)}
  />
)}

// 6. 기존 input 행 안에 MathInput 버튼 추가
<MathInput
  onOcrStart={handleOcrStart}
  onOcrComplete={handleOcrComplete}
  onOcrError={handleOcrError}
  onDrawPadOpen={() => setShowDrawPad(true)}
  disabled={isGenerating}
/>
```

---

## ⚙️ STEP 10 — MessageBubble 수정 (최소 변경)

기존 `MessageBubble.tsx` 에서 텍스트 렌더링 부분만 교체하라.

```typescript
// 기존: <p>{message.content}</p>
// 변경: <MathRenderer text={message.content} />

import { MathRenderer } from './MathRenderer'

// JSX에서
<MathRenderer text={message.content} className="text-sm leading-relaxed" />
```

---

## ⚙️ STEP 11 — KaTeX 글로벌 CSS 등록

`app/layout.tsx` 에 KaTeX CSS import 추가.

```typescript
// app/layout.tsx 맨 위에 추가
import 'katex/dist/katex.min.css'
```

---

## ✅ 완료 기준 체크리스트

```
[ ] npm 패키지 3개 설치 완료 (katex, react-katex, react-sketch-canvas)
[ ] /api/math-ocr POST 엔드포인트 동작
[ ] 채팅창 하단에 카메라(📷) · 갤러리 · 드로잉 버튼 3개 표시
[ ] 이미지 업로드 → "인식 중..." 스피너 표시
[ ] OCR 완료 → 수식 미리보기 + 확인/재시도/취소 버튼
[ ] 확인 클릭 → 기존 채팅 흐름으로 질문 전송
[ ] Claude 응답에서 $...$ 인라인 수식 렌더링
[ ] Claude 응답에서 $$...$$ 블록 수식 렌더링
[ ] 드로잉 패드에서 손글씨 그리기 → OCR 연동
[ ] 모바일에서 카메라 버튼이 카메라 앱 직접 열림
[ ] 5MB 초과 이미지 자동 리사이즈
[ ] OCR 실패 시 에러 메시지 표시 (앱 크래시 없음)
[ ] 기존 텍스트 채팅 기능 정상 동작 유지
```

---

## ❌ 하지 말 것

- 기존 채팅 API(`/api/chat`) 수정 금지 — OCR은 별도 `/api/math-ocr` 엔드포인트 사용
- `position: fixed` 사용 금지 — 드로잉 패드는 `position: absolute`로 처리
- `any` 타입 사용 금지
- KaTeX 렌더링 실패 시 앱 크래시 금지 — 반드시 `renderError` 핸들러 구현
- console.log 남기기 금지

---

## 🔑 환경 변수 (추가 불필요)

기존 `ANTHROPIC_API_KEY` 그대로 사용. 수학 OCR API가 같은 Claude API를 쓰므로 추가 환경변수 없음.

---

*이 프롬프트를 받았으면 STEP 1 → STEP 11 순서대로 구현하라.*
*각 STEP 완료 시 "✅ STEP N 완료 — [파일명]"을 출력하라.*
*모든 STEP 완료 후 체크리스트를 출력하고 미완성 항목을 마저 구현하라.*
