'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store';
import api from '../../lib/api';
import {
  LearningRecord, Recommendation, SUBJECT_LABELS, SUBJECT_EMOJIS, SUBJECT_COLORS
} from '../../lib/types';
import AppLayout from '../../components/AppLayout';
import styles from './history.module.css';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getSegment, getSubject } from '../../config/segments';

export default function HistoryPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<{
    records: LearningRecord[];
    recentQuestions: any[];
    weeklyCount: number;
  } | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [recRes, recmRes] = await Promise.all([
        api.get('/learning/records'),
        api.get('/learning/recommendations'),
      ]);
      setData(recRes.data);
      setRecommendations(recmRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>불러오는 중...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>📊 학습 기록</h1>
          {data && (
            <div className={styles.weekStat}>
              최근 7일 <strong>{data.weeklyCount}회</strong> 공부했어 🌟
            </div>
          )}
        </div>

        {/* Subject Records */}
        {data && data.records.length > 0 ? (
          <>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>과목별 학습 현황</h2>
              <div className={styles.recordGrid}>
                {data.records.map((r) => (
                  <div key={r.subject} className={styles.recordCard} style={{ '--color': SUBJECT_COLORS[r.subject as keyof typeof SUBJECT_COLORS] } as React.CSSProperties}>
                    <div className={styles.recordHeader}>
                      <span className={styles.recordEmoji}>{SUBJECT_EMOJIS[r.subject as keyof typeof SUBJECT_EMOJIS]}</span>
                      <span className={styles.recordSubject} style={{ color: SUBJECT_COLORS[r.subject as keyof typeof SUBJECT_COLORS] }}>
                        {SUBJECT_LABELS[r.subject as keyof typeof SUBJECT_LABELS]}
                      </span>
                    </div>
                    <div className={styles.recordStats}>
                      <div className={styles.recordStat}>
                        <span className={styles.recordStatNum}>{r.questionCount}</span>
                        <span className={styles.recordStatLabel}>총 질문</span>
                      </div>
                      <div className={styles.recordStat}>
                        <span className={styles.recordStatNum} style={{ color: r.wrongCount > 0 ? '#fca5a5' : 'inherit' }}>{r.wrongCount}</span>
                        <span className={styles.recordStatLabel}>오답</span>
                      </div>
                    </div>
                    <div className={styles.recordLast}>
                      마지막 학습: {formatDistanceToNow(new Date(r.lastStudiedAt), { addSuffix: true, locale: ko })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recent Questions */}
            {data.recentQuestions.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>최근 질문 목록</h2>
                <div className={styles.qList}>
                  {data.recentQuestions.map((q) => {
                    const seg = q.conversation?.segmentId ? getSegment(q.conversation.segmentId) : null;
                    const subj = q.conversation?.segmentId && q.conversation?.subjectId ? getSubject(q.conversation.segmentId, q.conversation.subjectId) : null;
                    const emoji = subj?.icon || (q.conversation?.subject ? SUBJECT_EMOJIS[q.conversation.subject as keyof typeof SUBJECT_EMOJIS] : '💬');
                    const label = seg ? seg.name : (q.conversation?.subject ? SUBJECT_LABELS[q.conversation.subject as keyof typeof SUBJECT_LABELS] : '일반');

                    return (
                      <div key={q.id} className={styles.qItem}>
                        <span className={styles.qEmoji}>{emoji}</span>
                        <div className={styles.qContent}>
                          <p className={styles.qText}>{q.content}</p>
                          <p className={styles.qMeta}>
                            {label} · {formatDistanceToNow(new Date(q.createdAt), { addSuffix: true, locale: ko })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>✨ 다음 학습 추천</h2>
                <div className={styles.recList}>
                  {recommendations.map((rec, i) => (
                    <div key={i} className={styles.recItem} style={{ '--color': SUBJECT_COLORS[rec.subject as keyof typeof SUBJECT_COLORS] } as React.CSSProperties}>
                      <span className={styles.recEmoji}>{SUBJECT_EMOJIS[rec.subject as keyof typeof SUBJECT_EMOJIS]}</span>
                      <p>{rec.message}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className={styles.empty}>
            <div className={styles.emptyEmoji}>📚</div>
            <h3>아직 학습 기록이 없어</h3>
            <p>AI 튜터에게 질문을 하면 여기에 기록이 남아!</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
