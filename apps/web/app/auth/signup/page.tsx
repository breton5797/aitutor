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
import { GRADE_LABELS, Grade } from '../../../lib/types';
import styles from '../auth.module.css';

const schema = z.object({
  name: z.string().min(2, '이름은 2자 이상이어야 해'),
  email: z.string().email('올바른 이메일 형식이어야 해'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 해'),
  grade: z.string().min(1, '학년을 선택해줘'),
});

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
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
      const res = await api.post('/auth/register', data);
      setAuth(res.data.user, res.data.token);
      toast.success(`환영해, ${res.data.user.name}! 🎉`);
      // 프로필 미완성이면 온보딩으로
      router.push('/onboarding');
    } catch (e: any) {
      toast.error(e.response?.data?.message || '회원가입에 실패했어. 다시 시도해봐.');
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
        <h1 className={styles.title}>회원가입</h1>
        <p className={styles.subtitle}>AI 튜터랑 공부 시작해보자!</p>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className="form-group">
            <label className="form-label">이름</label>
            <input
              {...register('name')}
              className="form-input"
              placeholder="이름을 입력해줘"
            />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">학년</label>
            <select {...register('grade')} className="form-input">
              <option value="">학년 선택</option>
              {Object.entries(GRADE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {errors.grade && <p className="form-error">{errors.grade.message}</p>}
          </div>

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
              placeholder="비밀번호 (6자 이상)"
            />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
            {loading ? '가입 중...' : '회원가입 하기 🚀'}
          </button>
        </form>

        <p className={styles.footer}>
          이미 계정이 있어?{' '}
          <Link href="/auth/login" className={styles.link}>로그인</Link>
        </p>
      </div>
    </div>
  );
}
