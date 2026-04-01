'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/store';
import api from '../../lib/api';
import AppLayout from '../../components/AppLayout';
import styles from './reports.module.css';

export default function ReportsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchReport();
  }, [user]);

  const fetchReport = async () => {
    try {
      const res = await api.get('/reports/parent');
      setReport(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    try {
      const res = await api.post('/billing/checkout/session', { planType: 'PARENT' });
      if (res.data.url) {
        window.location.href = res.data.url;
      } else {
        alert('결제 세션을 생성할 수 없습니다.');
      }
    } catch (e) {
      alert('Stripe 결제 처리 중 오류가 발생했습니다. (STRIPE_SECRET_KEY를 확인하세요)');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          <p>리포트 데이터를 불러오는 중...</p>
        </div>
      </AppLayout>
    );
  }

  const { isLocked, data, mockData, message } = report || {};

  return (
    <AppLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>부모용 안심 분석 리포트</h1>
          <p className={styles.subtitle}>
            우리 아이가 어떻게 공부하고 있는지, 어떤 어려움을 겪고 있는지 AI가 면밀히 분석합니다.
          </p>
        </div>

        {isLocked ? (
          <div className={styles.lockedWrapper}>
            <div className={styles.paywallOverlay}>
              <div className={styles.paywallCard}>
                <div className={styles.lockIcon}>🔒</div>
                <h2>정밀 분석 리포트는<br/>프리미엄 기능입니다</h2>
                <p>{message}</p>
                <ul className={styles.premiumFeatures}>
                  <li>✅ 총 학습 시간 및 루틴 분석</li>
                  <li>✅ 취약점 및 오답 패턴 정밀 분석</li>
                  <li>✅ 맞춤형 학습 솔루션 및 코멘트</li>
                  <li>✅ 위험 신호 (학습 공백, 특정 개념 반복 오답) 알림</li>
                </ul>
                <button className={styles.subscribeBtn} onClick={handleSubscribe}>
                  월 9,900원으로 구독 시작하기
                </button>
              </div>
            </div>

            <div className={`${styles.reportContent} ${styles.blurred}`}>
              <div className={styles.statCard}>
                <h3>총 학습 시간</h3>
                <div className={styles.statValue}>{mockData?.totalStudyTime}</div>
              </div>
              <div className={styles.statCard}>
                <h3>학습 취약점</h3>
                <div className={styles.statValue}>{mockData?.weakness}</div>
              </div>
              <div className={styles.aiCommentCard}>
                <h3>AI 튜터 총평</h3>
                <p>{mockData?.aiComment}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.reportContent}>
            <div className={styles.statGrid}>
              <div className={styles.statCard}>
                <h3>총 학습 시간</h3>
                <div className={styles.statValue}>{data?.totalStudyTime}</div>
              </div>
              <div className={styles.statCard}>
                <h3>최근 오답 빈도 (AI 감지)</h3>
                <div className={styles.statValue}>{data?.recentErrors}개 위험 신호!</div>
              </div>
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>⚠️ 학습 취약점 분석</h3>
              <ul className={styles.weaknessesList}>
                {data?.weaknesses?.map((w: string, i: number) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>

            <div className={styles.aiCommentCard}>
              <h3>🎓 AI 튜터 1:1 코멘트</h3>
              <p>{data?.aiComment}</p>
              <button className={styles.remedyBtn}>솔루션(추천 학습) 적용하기</button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
