'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store';
import api from '../../lib/api';
import { SUBJECT_LABELS, SUBJECT_EMOJIS, SUBJECT_COLORS } from '../../lib/types';
import AppLayout from '../../components/AppLayout';
import styles from './chat.module.css';
import { SEGMENTS } from '../../config/segments';

export default function ChatSelectPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) router.push('/auth/login');
  }, [user]);



  return (
    <AppLayout>
      <div className={styles.container}>
        <h1 className={styles.title}>어떤 클래스를 시작할까요? 📚</h1>
        <p className={styles.subtitle}>대상을 선택하시면 특화된 AI 튜터가 연결됩니다.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', padding: '20px 0' }}>
          {Object.values(SEGMENTS).map((seg) => (
            <button
              key={seg.id}
              style={{
                textAlign: 'left',
                backgroundColor: seg.bgColor,
                borderRadius: '16px',
                padding: '24px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => router.push(`/${seg.id}`)}
            >
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: seg.accentColor, marginBottom: '8px' }}>
                {seg.targetAge}
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#333' }}>{seg.name}</h3>
              <p style={{ fontSize: '14px', color: '#555', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                {seg.description}
              </p>
              <div style={{
                backgroundColor: seg.accentColor,
                color: seg.textOnAccent,
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 'bold',
                textAlign: 'center',
                width: '100%'
              }}>과목 보기</div>
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
