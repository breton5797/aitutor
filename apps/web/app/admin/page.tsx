'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store';
import api from '../../lib/api';
import { SUBJECT_LABELS, SUBJECT_EMOJIS, GRADE_LABELS } from '../../lib/types';
import styles from './admin.module.css';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

type AdminTab = 'dashboard' | 'users' | 'conversations' | 'records';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuthStore();
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [dashData, setDashData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (!isAdmin()) { router.push('/dashboard'); return; }
    fetchDashboard();
  }, [user]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/dashboard');
      setDashData(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/conversations');
      setConversations(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/records');
      setRecords(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const switchTab = (t: AdminTab) => {
    setTab(t);
    if (t === 'dashboard') fetchDashboard();
    if (t === 'users') fetchUsers();
    if (t === 'conversations') fetchConversations();
    if (t === 'records') fetchRecords();
  };

  const tabs: { key: AdminTab; label: string; emoji: string }[] = [
    { key: 'dashboard', label: '대시보드', emoji: '📊' },
    { key: 'users', label: '회원관리', emoji: '👥' },
    { key: 'conversations', label: '대화로그', emoji: '💬' },
    { key: 'records', label: '학습기록', emoji: '📈' },
  ];

  return (
    <div className={styles.layout}>
      {/* Admin Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>
          <div className={styles.logo}>🎓 AI Tutor</div>
          <div className={styles.adminBadge}>관리자</div>
        </div>
        <nav className={styles.nav}>
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`${styles.navItem} ${tab === t.key ? styles.active : ''}`}
              onClick={() => switchTab(t.key)}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        <button className={styles.backBtn} onClick={() => router.push('/dashboard')}>
          ← 학생 화면으로
        </button>
      </aside>

      {/* Content */}
      <main className={styles.main}>
        {loading ? (
          <div className={styles.loading}><div className={styles.spinner} /></div>
        ) : (
          <>
            {/* Dashboard Tab */}
            {tab === 'dashboard' && dashData && (
              <div className={styles.content}>
                <h1 className={styles.pageTitle}>📊 관리자 대시보드</h1>
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>👥</div>
                    <div className={styles.statNum}>{dashData.totalUsers}</div>
                    <div className={styles.statLabel}>전체 학생</div>
                  </div>
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>💬</div>
                    <div className={styles.statNum}>{dashData.todayMessages}</div>
                    <div className={styles.statLabel}>오늘 질문 수</div>
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.box}>
                    <h3 className={styles.boxTitle}>과목별 질문 수</h3>
                    {dashData.subjectStats.map((s: any) => (
                      <div key={s.subject} className={styles.subjectRow}>
                        <span>{SUBJECT_EMOJIS[s.subject as keyof typeof SUBJECT_EMOJIS]} {SUBJECT_LABELS[s.subject as keyof typeof SUBJECT_LABELS]}</span>
                        <span className={styles.statBadge}>{s._sum.questionCount || 0}회</span>
                      </div>
                    ))}
                    {dashData.subjectStats.length === 0 && <p className={styles.empty}>데이터 없음</p>}
                  </div>
                  <div className={styles.box}>
                    <h3 className={styles.boxTitle}>최근 가입자</h3>
                    {dashData.recentUsers.map((u: any) => (
                      <div key={u.id} className={styles.userRow}>
                        <div className={styles.userAvatar}>{u.name[0]}</div>
                        <div>
                          <p className={styles.userName}>{u.name}</p>
                          <p className={styles.userMeta}>{GRADE_LABELS[u.grade as keyof typeof GRADE_LABELS]}</p>
                        </div>
                        <span className={styles.userDate}>
                          {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true, locale: ko })}
                        </span>
                      </div>
                    ))}
                    {dashData.recentUsers.length === 0 && <p className={styles.empty}>데이터 없음</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {tab === 'users' && (
              <div className={styles.content}>
                <h1 className={styles.pageTitle}>👥 회원 관리 ({users.length}명)</h1>
                <div className={styles.table}>
                  <div className={styles.tableHead}>
                    <span>이름</span><span>이메일</span><span>학년</span><span>가입일</span><span>총 질문</span>
                  </div>
                  {users.map((u) => (
                    <div key={u.id} className={styles.tableRow}>
                      <span className={styles.bold}>{u.name}</span>
                      <span className={styles.muted}>{u.email}</span>
                      <span>{GRADE_LABELS[u.grade as keyof typeof GRADE_LABELS]}</span>
                      <span className={styles.muted}>{new Date(u.createdAt).toLocaleDateString('ko')}</span>
                      <span className={styles.statBadge}>{u.learningRecords.reduce((a: number, r: any) => a + r.questionCount, 0)}회</span>
                    </div>
                  ))}
                  {users.length === 0 && <p className={styles.empty}>회원이 없습니다.</p>}
                </div>
              </div>
            )}

            {/* Conversations Tab */}
            {tab === 'conversations' && (
              <div className={styles.content}>
                <h1 className={styles.pageTitle}>💬 대화 로그 ({conversations.length}개)</h1>
                <div className={styles.convList}>
                  {conversations.map((c) => (
                    <div key={c.id} className={styles.convCard}>
                      <div className={styles.convHeader}>
                        <span>{SUBJECT_EMOJIS[c.subject as keyof typeof SUBJECT_EMOJIS]} {SUBJECT_LABELS[c.subject as keyof typeof SUBJECT_LABELS]}</span>
                        <span className={styles.muted}>{c.user.name} ({c.user.email})</span>
                        <span className={styles.muted}>{formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true, locale: ko })}</span>
                      </div>
                      <p className={styles.convTitle}>{c.title}</p>
                      <p className={styles.convMsgCount}>메시지 {c.messages.length}개</p>
                    </div>
                  ))}
                  {conversations.length === 0 && <p className={styles.empty}>대화 기록이 없습니다.</p>}
                </div>
              </div>
            )}

            {/* Records Tab */}
            {tab === 'records' && (
              <div className={styles.content}>
                <h1 className={styles.pageTitle}>📈 학습 기록 ({records.length}건)</h1>
                <div className={styles.table}>
                  <div className={styles.tableHead}>
                    <span>학생</span><span>학년</span><span>과목</span><span>질문</span><span>오답</span><span>최근 학습</span>
                  </div>
                  {records.map((r) => (
                    <div key={r.id} className={styles.tableRow}>
                      <span className={styles.bold}>{r.user.name}</span>
                      <span className={styles.muted}>{GRADE_LABELS[r.user.grade as keyof typeof GRADE_LABELS]}</span>
                      <span>{SUBJECT_EMOJIS[r.subject as keyof typeof SUBJECT_EMOJIS]} {SUBJECT_LABELS[r.subject as keyof typeof SUBJECT_LABELS]}</span>
                      <span className={styles.statBadge}>{r.questionCount}회</span>
                      <span style={{ color: r.wrongCount > 0 ? '#fca5a5' : 'inherit' }}>{r.wrongCount}회</span>
                      <span className={styles.muted}>{formatDistanceToNow(new Date(r.lastStudiedAt), { addSuffix: true, locale: ko })}</span>
                    </div>
                  ))}
                  {records.length === 0 && <p className={styles.empty}>기록이 없습니다.</p>}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
