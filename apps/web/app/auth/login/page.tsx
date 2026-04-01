'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../../../lib/api';
import { useAuthStore } from '../../../lib/store';
import styles from '../auth.module.css';

const schema = z.object({
  email: z.string().email('올바른 이메일 형식이어야 해'),
  password: z.string().min(1, '비밀번호를 입력해줘'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', data);
      setAuth(res.data.user, res.data.token);
      toast.success(`반가워, ${res.data.user.name}! 😊`);
      if (res.data.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || '로그인에 실패했어. 이메일과 비밀번호를 확인해봐.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span>🎓</span>
          <span>AI Tutor</span>
        </div>
        <h1 className={styles.title}>로그인</h1>
        <p className={styles.subtitle}>다시 왔구나! 오늘도 같이 공부해보자 😊</p>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className="form-group">
            <label className="form-label">이메일</label>
            <input
              {...register('email')}
              type="email"
              className="form-input"
              placeholder="이메일을 입력해줘"
            />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">비밀번호</label>
            <input
              {...register('password')}
              type="password"
              className="form-input"
              placeholder="비밀번호를 입력해줘"
            />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인 하기 →'}
          </button>
        </form>

        <p className={styles.footer}>
          아직 계정이 없어?{' '}
          <Link href="/auth/signup" className={styles.link}>회원가입</Link>
        </p>
      </div>
    </div>
  );
}
