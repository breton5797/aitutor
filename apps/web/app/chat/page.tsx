'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store';
import api from '../../lib/api';
import { Subject, SUBJECT_LABELS, SUBJECT_EMOJIS, SUBJECT_COLORS } from '../../lib/types';
import AppLayout from '../../components/AppLayout';
import styles from './chat.module.css';

const SUBJECTS: Subject[] = ['ENGLISH', 'MATH', 'SCIENCE', 'HISTORY'];

export default function ChatSelectPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) router.push('/auth/login');
  }, [user]);

  const startChat = async (subject: Subject) => {
    const res = await api.post('/conversations', { subject });
    router.push(`/chat/${res.data.id}`);
  };

  return (
    <AppLayout>
      <div className={styles.container}>
        <h1 className={styles.title}>어떤 과목 공부할까? 📚</h1>
        <p className={styles.subtitle}>과목을 선택하면 AI 튜터가 바로 도와줄게</p>
        <div className={styles.grid}>
          {SUBJECTS.map((s) => (
            <button
              key={s}
              className={styles.card}
              style={{
                '--color': SUBJECT_COLORS[s],
                borderColor: SUBJECT_COLORS[s] + '30',
              } as React.CSSProperties}
              onClick={() => startChat(s)}
            >
              <span className={styles.emoji}>{SUBJECT_EMOJIS[s]}</span>
              <span className={styles.name} style={{ color: SUBJECT_COLORS[s] }}>{SUBJECT_LABELS[s]}</span>
              <span className={styles.desc}>{getSubjectDesc(s)}</span>
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

function getSubjectDesc(s: Subject): string {
  const map: Record<Subject, string> = {
    ENGLISH: '문법·독해·작문·단어',
    MATH: '개념·문제풀이·공식',
    SCIENCE: '개념·원리·실험',
    HISTORY: '흐름·사건·인물',
  };
  return map[s];
}
