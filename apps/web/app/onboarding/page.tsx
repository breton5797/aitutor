'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuthStore } from '../../lib/store';
import { ExplainStyle, StudyGoal } from '../../lib/types';
import { SEGMENTS } from '../../config/segments';
import styles from './onboarding.module.css';

const EXPLAIN_STYLES = [
  { value: 'SHORT', label: '핵심 요약 위주 ⚡', desc: '바쁜 일상, 핵심만 빠르게 알고 싶어요' },
  { value: 'DETAILED', label: '원리부터 차근차근 📖', desc: '기초부터 깊이 있게 이해하고 싶어요' },
];

const GOALS = [
  { value: 'EXAM', label: '시험/자격증 합격 📝' },
  { value: 'DAILY', label: '실무/일상 적용 💼' },
  { value: 'ASSIGNMENT', label: '과제/면접 대비 🗣️' },
  { value: 'CONCEPT', label: '깊이 있는 교양/개념 💡' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [preferSubjects, setPreferSubjects] = useState<string[]>([]);
  const [hardSubjects, setHardSubjects] = useState<string[]>([]);
  const [explainStyle, setExplainStyle] = useState('DETAILED');
  const [goal, setGoal] = useState('DAILY');

  const toggleSelection = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
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
            <p className={styles.stepDesc}>어떤 분야에 가장 관심이 많으신가요? (여러 개 선택 가능)</p>
            <div className={styles.subjectGrid}>
              {Object.values(SEGMENTS).map((seg) => (
                <button
                  key={seg.id}
                  className={`${styles.subjectBtn} ${preferSubjects.includes(seg.id) ? styles.selected : ''}`}
                  onClick={() => toggleSelection(preferSubjects, setPreferSubjects, seg.id)}
                  type="button"
                >
                  <span className={styles.subjectBtnEmoji} style={{ background: seg.bgColor }}>{seg.id === 'k12' ? '🎒' : seg.id === 'university' ? '🎓' : seg.id === 'worker' ? '💼' : seg.id === 'cert' ? '📜' : seg.id === 'silver' ? '👵' : '🌐'}</span>
                  <span>{seg.name}</span>
                </button>
              ))}
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} onClick={() => setStep(2)}>
              다음 →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className={styles.stepContent}>
            <div className={styles.stepEmoji}>🤔</div>
            <h1 className={styles.stepTitle}>특히 집중하고 싶은 세부 분야는?</h1>
            <p className={styles.stepDesc}>선택하신 관심 그룹 내 특정 과목/분야 (여러 개 선택 가능)</p>
            <div className={styles.subjectGrid}>
              {preferSubjects.length === 0 ? (
                <p>먼저 이전 단계에서 관심 그룹을 선택해주세요!</p>
              ) : (
                preferSubjects.flatMap(segId => SEGMENTS[segId]?.subjects || []).map((sub) => (
                  <button
                    key={sub.id}
                    className={`${styles.subjectBtn} ${styles.hard} ${hardSubjects.includes(sub.id) ? styles.selectedHard : ''}`}
                    onClick={() => toggleSelection(hardSubjects, setHardSubjects, sub.id)}
                    type="button"
                  >
                    <span className={styles.subjectBtnEmoji}>{sub.icon}</span>
                    <span>{sub.name}</span>
                  </button>
                ))
              )}
            </div>
            <div className={styles.btnRow} style={{ marginTop: '16px' }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← 이전</button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>다음 →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={styles.stepContent}>
            <div className={styles.stepEmoji}>🎯</div>
            <h1 className={styles.stepTitle}>원하시는 코칭 스타일은?</h1>
            <p className={styles.stepDesc}>AI 튜터가 맞춤형으로 설명해 드립니다</p>

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
