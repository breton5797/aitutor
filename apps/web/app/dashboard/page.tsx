'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../lib/store';
import api from '../../lib/api';
import {
  Subject, SUBJECT_LABELS, SUBJECT_EMOJIS, SUBJECT_COLORS, SUBJECT_BG,
  LearningRecord, Recommendation, Conversation
} from '../../lib/types';
import styles from './dashboard.module.css';
import AppLayout from '../../components/AppLayout';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

const SUBJECTS: Subject[] = ['ENGLISH', 'MATH', 'SCIENCE', 'HISTORY'];

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [records, setRecords] = useState<LearningRecord[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [recRes, recmRes, convRes] = await Promise.all([
        api.get('/learning/records'),
        api.get('/learning/recommendations'),
        api.get('/conversations'),
      ]);
      setRecords(recRes.data.records);
      setRecommendations(recmRes.data);
      setRecentConversations(convRes.data.slice(0, 5));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (subject: Subject) => {
    const res = await api.post('/conversations', { subject });
    router.push(`/chat/${res.data.id}`);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '좋은 아침이야 ☀️';
    if (hour < 17) return '안녕 😊';
    if (hour < 21) return '잘 하고 있어 🌙';
    return '늦게까지 공부하는구나 🌟';
  };

  if (loading) {
    return (
      <AppLayout>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          <p>불러오는 중...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className={styles.container}>
        {/* Greeting */}
        <div className={styles.greeting}>
          <div>
            <h1 className={styles.greetingTitle}>
              {getGreeting()} {user?.name}!
            </h1>
            <p className={styles.greetingDesc}>오늘도 같이 공부해보자! 뭐부터 시작할까? 📚</p>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>✨ 오늘의 추천 학습</h2>
            <div className={styles.recGrid}>
              {recommendations.map((rec, i) => (
                <button
                  key={i}
                  className={styles.recCard}
                  style={{
                    '--accent': SUBJECT_COLORS[rec.subject],
                    '--bg': SUBJECT_BG[rec.subject],
                  } as React.CSSProperties}
                  onClick={() => startChat(rec.subject)}
                >
                  <div className={styles.recEmoji}>{SUBJECT_EMOJIS[rec.subject]}</div>
                  <div className={styles.recSubject}>{SUBJECT_LABELS[rec.subject]}</div>
                  <p className={styles.recMessage}>{rec.message}</p>
                  <span className={styles.recAction}>시작하기 →</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Subject Quick Start */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>⚡ 빠른 과목 선택</h2>
          <div className={styles.subjectGrid}>
            {SUBJECTS.map((s) => {
              const record = records.find((r) => r.subject === s);
              return (
                <button
                  key={s}
                  className={styles.subjectCard}
                  style={{
                    '--color': SUBJECT_COLORS[s],
                    '--bg': SUBJECT_BG[s],
                  } as React.CSSProperties}
                  onClick={() => startChat(s)}
                >
                  <div className={styles.subjectEmoji}>{SUBJECT_EMOJIS[s]}</div>
                  <div className={styles.subjectName}>{SUBJECT_LABELS[s]}</div>
                  {record && (
                    <div className={styles.subjectStats}>
                      질문 {record.questionCount}회
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Recent Conversations */}
        {recentConversations.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>📝 최근 대화</h2>
              <Link href="/history" className="btn btn-ghost btn-sm">전체 보기</Link>
            </div>
            <div className={styles.convList}>
              {recentConversations.map((conv) => (
                <Link key={conv.id} href={`/chat/${conv.id}`} className={styles.convItem}>
                  <div className={styles.convEmoji}>{SUBJECT_EMOJIS[conv.subject]}</div>
                  <div className={styles.convInfo}>
                    <p className={styles.convTitle}>{conv.title}</p>
                    <p className={styles.convDate}>
                      {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true, locale: ko })}
                    </p>
                  </div>
                  <div
                    className={styles.convSubject}
                    style={{ color: SUBJECT_COLORS[conv.subject] }}
                  >
                    {SUBJECT_LABELS[conv.subject]}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Learning Stats */}
        {records.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>📊 학습 현황</h2>
            <div className={styles.statsGrid}>
              {records.map((r) => (
                <div key={r.subject} className={styles.statCard} style={{ '--color': SUBJECT_COLORS[r.subject] } as React.CSSProperties}>
                  <div className={styles.statEmoji}>{SUBJECT_EMOJIS[r.subject]}</div>
                  <div className={styles.statInfo}>
                    <div className={styles.statSubject}>{SUBJECT_LABELS[r.subject]}</div>
                    <div className={styles.statCount}>총 {r.questionCount}회 질문</div>
                    {r.wrongCount > 0 && (
                      <div className={styles.statWrong}>오답 {r.wrongCount}회</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {records.length === 0 && recentConversations.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyEmoji}>🌟</div>
            <h3>첫 번째 질문을 해봐!</h3>
            <p>위에서 과목을 선택하고 AI 튜터에게 궁금한 것을 물어봐</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
