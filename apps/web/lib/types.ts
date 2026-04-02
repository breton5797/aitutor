export type Grade = 'ELEMENTARY' | 'MIDDLE_1' | 'MIDDLE_2' | 'MIDDLE_3' | 'HIGH_1' | 'HIGH_2' | 'HIGH_3' | 'COLLEGE' | 'WORKER' | 'CERTIFICATION' | 'SENIOR' | 'GENERAL';
export type Subject = 'ENGLISH' | 'MATH' | 'SCIENCE' | 'HISTORY';
export type Role = 'STUDENT' | 'ADMIN';
export type ExplainStyle = 'SHORT' | 'DETAILED';
export type StudyGoal = 'EXAM' | 'DAILY' | 'ASSIGNMENT' | 'CONCEPT';
export type MessageRole = 'USER' | 'ASSISTANT';
export type QuestionType = 'concept' | 'solve' | 'wrong_answer' | 'summary' | 'recommend' | 'casual';

export interface User {
  id: string;
  email: string;
  name: string;
  grade: Grade;
  role: Role;
  createdAt: string;
  profile?: StudentProfile;
}

export interface StudentProfile {
  id: string;
  userId: string;
  preferSubjects: Subject[];
  hardSubjects: Subject[];
  explainStyle: ExplainStyle;
  goal: StudyGoal;
}

export interface Conversation {
  id: string;
  userId: string;
  subject: Subject;
  segmentId?: string;
  subjectId?: string;
  courseId?: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  questionType: QuestionType;
  createdAt: string;
  audioBase64?: string;
  attachmentUrl?: string;
}

export interface LearningRecord {
  id: string;
  subject: Subject;
  questionCount: number;
  wrongCount: number;
  lastStudiedAt: string;
}

export interface Recommendation {
  subject: Subject;
  message: string;
  type: string;
}

// UI helpers
export const SUBJECT_LABELS: Record<Subject, string> = {
  ENGLISH: '영어',
  MATH: '수학',
  SCIENCE: '과학',
  HISTORY: '역사',
};

export const SUBJECT_EMOJIS: Record<Subject, string> = {
  ENGLISH: '📖',
  MATH: '📐',
  SCIENCE: '🔬',
  HISTORY: '📜',
};

export const SUBJECT_COLORS: Record<Subject, string> = {
  ENGLISH: '#67e8f9',
  MATH: '#fcd34d',
  SCIENCE: '#6ee7b7',
  HISTORY: '#fca5a5',
};

export const SUBJECT_BG: Record<Subject, string> = {
  ENGLISH: 'rgba(6, 182, 212, 0.1)',
  MATH: 'rgba(245, 158, 11, 0.1)',
  SCIENCE: 'rgba(16, 185, 129, 0.1)',
  HISTORY: 'rgba(239, 68, 68, 0.1)',
};

export const GRADE_LABELS: Record<Grade, string> = {
  ELEMENTARY: '초등학생 / 유아',
  MIDDLE_1: '중학교 1학년',
  MIDDLE_2: '중학교 2학년',
  MIDDLE_3: '중학교 3학년',
  HIGH_1: '고등학교 1학년',
  HIGH_2: '고등학교 2학년',
  HIGH_3: '고등학교 3학년',
  COLLEGE: '대학생',
  WORKER: '직장인 / 실무자',
  CERTIFICATION: '자격증/어학 시험 준비생',
  SENIOR: '시니어 (디지털 튜터)',
  GENERAL: '일반 / 글로벌 사용자',
};
