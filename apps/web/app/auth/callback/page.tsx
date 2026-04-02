'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../../lib/store';
import toast from 'react-hot-toast';
import styles from '../auth.module.css';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const token = searchParams?.get('token');
    const userStr = searchParams?.get('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        setAuth(user, token);
        toast.success(`반가워, ${user.name}! 소셜 로그인 성공 😊`);
        if (user.role === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } catch (err) {
        toast.error('로그인 정보 처리에 실패했습니다.');
        router.push('/auth/login');
      }
    } else {
      toast.error('잘못된 로그인 접근입니다.');
      router.push('/auth/login');
    }
  }, [searchParams, router, setAuth]);

  return (
    <div className={styles.container}>
      <div className={styles.card} style={{ textAlign: 'center' }}>
        <h2>로그인 처리 중... 🚀</h2>
        <p>잠시만 기다려주세요!</p>
      </div>
    </div>
  );
}
