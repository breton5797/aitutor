'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, useLanguageStore } from '../../lib/store';
import { TRANSLATIONS, LANGUAGES, SupportedLanguage } from '../../lib/i18n';
import api from '../../lib/api';
import {
  Subject, SUBJECT_LABELS, SUBJECT_EMOJIS, SUBJECT_COLORS, SUBJECT_BG,
  LearningRecord, Recommendation, Conversation
} from '../../lib/types';
import styles from './dashboard.module.css';
import AppLayout from '../../components/AppLayout';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getSegment, getSubject } from '../../config/segments';
import { SEGMENTS } from '../../config/segments';

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [records, setRecords] = useState<LearningRecord[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [conversationList, setRecentConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { lang, setLang } = useLanguageStore();
  const t = TRANSLATIONS[lang];

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
    if (hour < 12) return t.greeting_morning;
    if (hour < 17) return t.greeting_afternoon;
    if (hour < 21) return t.greeting_evening;
    return t.greeting_night;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          <p>{t.loading_chat || '불러오는 중...'}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className={styles.container}>
        {/* Top Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as SupportedLanguage)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', background: 'white', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
          >
            {(Object.keys(LANGUAGES) as SupportedLanguage[]).map((k) => (
              <option key={k} value={k}>{LANGUAGES[k]}</option>
            ))}
          </select>
        </div>

        {/* Greeting */}
        <div className={styles.greeting}>
          <div>
            <h1 className={styles.greetingTitle}>
              {getGreeting()} {user?.name}!
            </h1>
            <p className={styles.greetingDesc}>{t.greeting_desc}</p>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t.today_recommend}</h2>
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
                  <span className={styles.recAction}>{t.start_btn}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Segment Quick Start */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>새로운 클래스 시작하기</h2>
          <div className={styles.subjectGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {Object.values(SEGMENTS).slice(0,4).map((seg) => (
              <button
                key={seg.id}
                className={styles.subjectCard}
                style={{
                  '--color': seg.accentColor,
                  '--bg': seg.bgColor,
                } as React.CSSProperties}
                onClick={() => router.push(`/${seg.id}`)}
              >
                <div className={styles.subjectEmoji}>{seg.subjects[0]?.icon || '🎓'}</div>
                <div className={styles.subjectName}>{seg.name}</div>
                <div className={styles.subjectStats}>연령관/특화코스</div>
              </button>
            ))}
          </div>
        </section>

        {/* Recent Conversations */}
        {conversationList.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>📝 {t.recent_classes}</h2>
              <Link href="/history" className="btn btn-ghost btn-sm">{t.all_classes}</Link>
            </div>
            <div className={styles.convList}>
              {conversationList.map((conv) => {
                const seg = conv.segmentId ? getSegment(conv.segmentId) : null;
                const subj = conv.segmentId && conv.subjectId ? getSubject(conv.segmentId, conv.subjectId) : null;
                const themeColor = seg?.accentColor || (conv.subject ? SUBJECT_COLORS[conv.subject] : '#ccc');
                const label = seg ? seg.name : (conv.subject ? SUBJECT_LABELS[conv.subject] : '일반');
                const emoji = subj?.icon || (conv.subject ? SUBJECT_EMOJIS[conv.subject] : '💬');
                
                return (
                  <Link key={conv.id} href={`/chat/${conv.id}`} className={styles.convItem}>
                    <div className={styles.convEmoji}>{emoji}</div>
                    <div className={styles.convInfo}>
                      <p className={styles.convTitle}>{conv.title}</p>
                      <p className={styles.convDate}>
                        {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true, locale: ko })}
                      </p>
                    </div>
                    <div
                      className={styles.convSubject}
                      style={{ color: themeColor, borderColor: themeColor + '50', padding: '2px 8px', border: '1px solid', borderRadius: '12px', fontSize: '12px' }}
                    >
                      {label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Learning Stats */}
        {records.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t.learning_stats}</h2>
            <div className={styles.statsGrid}>
              {records.map((r) => (
                <div key={r.subject} className={styles.statCard} style={{ '--color': SUBJECT_COLORS[r.subject] } as React.CSSProperties}>
                  <div className={styles.statEmoji}>{SUBJECT_EMOJIS[r.subject]}</div>
                  <div className={styles.statInfo}>
                    <div className={styles.statSubject}>{SUBJECT_LABELS[r.subject]}</div>
                    <div className={styles.statCount}>{(t.question_count || '').replace('{count}', String(r.questionCount))}</div>
                    {r.wrongCount > 0 && (
                      <div className={styles.statWrong}>{(t.wrong_count || '').replace('{count}', String(r.wrongCount))}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {records.length === 0 && conversationList.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyEmoji}>🌟</div>
            <h3>{t.no_records_title}</h3>
            <p>{t.no_records_desc}</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
