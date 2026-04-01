'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuthStore } from '../../lib/store';
import { Subject, SUBJECT_LABELS, SUBJECT_EMOJIS } from '../../lib/types';
import styles from './onboarding.module.css';

const SUBJECTS: Subject[] = ['ENGLISH', 'MATH', 'SCIENCE', 'HISTORY'];

const EXPLAIN_STYLES = [
  { value: 'SHORT', label: '짧고 핵심만 📌', desc: '핵심만 빠르게 설명해줘' },
  { value: 'DETAILED', label: '차근차근 자세히 📖', desc: '단계별로 꼼꼼히 설명해줘' },
];

const GOALS = [
  { value: 'EXAM', label: '시험 대비 📝' },
  { value: 'DAILY', label: '평소 공부 📚' },
  { value: 'ASSIGNMENT', label: '수행평가/과제 ✏️' },
  { value: 'CONCEPT', label: '개념 이해 💡' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [preferSubjects, setPreferSubjects] = useState<Subject[]>([]);
  const [hardSubjects, setHardSubjects] = useState<Subject[]>([]);
  const [explainStyle, setExplainStyle] = useState('DETAILED');
  const [goal, setGoal] = useState('DAILY');

  const toggleSubject = (arr: Subject[], setArr: (v: Subject[]) => void, s: Subject) => {
    setArr(arr.includes(s) ? arr.filter((x) => x !== s) : [...arr, s]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/student/profile', {
        preferSubjects,
        hardSubjects,
        explainStyle,
        goal,
      });
      toast.success('프로필 설정 완료! 이제 공부 시작해보자 🚀');
      router.push('/dashboard');
    } catch {
      toast.error('프로필 저장에 실패했어. 다시 시도해봐.');
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = 3;

  return (
    <div className={styles.container}>
      {/* Progress */}
      <div className={styles.progress}>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${(step / totalSteps) * 100}%` }} />
        </div>
        <span className={styles.progressText}>{step} / {totalSteps}</span>
      </div>

      <div className={styles.card}>
        {step === 1 && (
          <div className={styles.stepContent}>
            <div className={styles.stepEmoji}>👋</div>
            <h1 className={styles.stepTitle}>
              {user?.name}아, 반가워!
            </h1>
            <p className={styles.stepDesc}>어떤 과목을 좋아해? (여러 개 선택 가능)</p>
            <div className={styles.subjectGrid}>
              {SUBJECTS.map((s) => (
                <button
                  key={s}
                  className={`${styles.subjectBtn} ${preferSubjects.includes(s) ? styles.selected : ''}`}
                  onClick={() => toggleSubject(preferSubjects, setPreferSubjects, s)}
                  type="button"
                >
                  <span className={styles.subjectBtnEmoji}>{SUBJECT_EMOJIS[s]}</span>
                  <span>{SUBJECT_LABELS[s]}</span>
                </button>
              ))}
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setStep(2)}>
              다음 →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className={styles.stepContent}>
            <div className={styles.stepEmoji}>🤔</div>
            <h1 className={styles.stepTitle}>어려운 과목이 있어?</h1>
            <p className={styles.stepDesc}>AI 튜터가 더 신경 써줄게! (여러 개 선택 가능)</p>
            <div className={styles.subjectGrid}>
              {SUBJECTS.map((s) => (
                <button
                  key={s}
                  className={`${styles.subjectBtn} ${styles.hard} ${hardSubjects.includes(s) ? styles.selectedHard : ''}`}
                  onClick={() => toggleSubject(hardSubjects, setHardSubjects, s)}
                  type="button"
                >
                  <span className={styles.subjectBtnEmoji}>{SUBJECT_EMOJIS[s]}</span>
                  <span>{SUBJECT_LABELS[s]}</span>
                </button>
              ))}
            </div>
            <div className={styles.btnRow}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← 이전</button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>다음 →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={styles.stepContent}>
            <div className={styles.stepEmoji}>🎯</div>
            <h1 className={styles.stepTitle}>공부 스타일은?</h1>
            <p className={styles.stepDesc}>AI 튜터가 맞춰서 설명해줄게</p>

            <div className={styles.optionGroup}>
              <p className={styles.optionLabel}>설명 방식</p>
              <div className={styles.optionGrid}>
                {EXPLAIN_STYLES.map((s) => (
                  <button
                    key={s.value}
                    className={`${styles.optionBtn} ${explainStyle === s.value ? styles.optionSelected : ''}`}
                    onClick={() => setExplainStyle(s.value)}
                    type="button"
                  >
                    <span className={styles.optionBtnLabel}>{s.label}</span>
                    <span className={styles.optionBtnDesc}>{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.optionGroup}>
              <p className={styles.optionLabel}>공부 목표</p>
              <div className={styles.optionGrid2}>
                {GOALS.map((g) => (
                  <button
                    key={g.value}
                    className={`${styles.optionBtn} ${goal === g.value ? styles.optionSelected : ''}`}
                    onClick={() => setGoal(g.value)}
                    type="button"
                  >
                    <span className={styles.optionBtnLabel}>{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.btnRow}>
              <button className="btn btn-ghost" onClick={() => setStep(2)}>← 이전</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? '저장 중...' : '완료! 공부 시작 🚀'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
