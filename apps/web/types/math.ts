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
