export type SegmentId = 'k12' | 'university' | 'worker' | 'cert' | 'silver' | 'global'

export interface Course {
  id: string
  name: string
  description: string
  level: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  demandScore: number   // 1-100, 시장 수요도
  isHot?: boolean
  isNew?: boolean
  systemPrompt: string  // 이 코스의 선생님 행동 규칙 전체
  starterQuestions: string[]  // 첫 화면에 보여줄 추천 질문 5개
}

export interface Subject {
  id: string
  name: string
  icon: string
  description: string
  courses: Course[]
}

export interface SegmentConfig {
  id: SegmentId
  name: string
  shortName: string
  description: string
  targetAge: string
  accentColor: string
  bgColor: string
  textOnAccent: string
  uiMode: 'kids' | 'youth' | 'adult' | 'senior' | 'global'
  fontSize: 'sm' | 'md' | 'lg' | 'xl'    // 실버는 xl
  subjects: Subject[]
  pricing: {
    monthly: number
    yearly: number
    trialDays: number
  }
  teacherPersona: {
    tone: string        // 전체 세그먼트 공통 톤
    language: string    // 'ko' | 'ko-en' | 'multilingual'
    responseLength: 'short' | 'medium' | 'long'
    useEmoji: boolean
    useFormalSpeech: boolean
  }
}