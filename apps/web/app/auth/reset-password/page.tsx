'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../../../lib/api';
import styles from '../auth.module.css';

const schema = z.object({
  email: z.string().email('올바른 이메일 형식이어야 해'),
  newPassword: z.string().min(6, '비밀번호는 최소 6자 이상이어야 해'),
  confirmPassword: z.string().min(6, '비밀번호를 한 번 더 입력해줘'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: '비밀번호가 서로 일치하지 않아!',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: data.email,
        newPassword: data.newPassword,
      });
      toast.success('비밀번호가 성공적으로 변경되었어! 새 비밀번호로 로그인해봐 😊');
      router.push('/auth/login');
    } catch (e: any) {
      toast.error(e.response?.data?.message || '비밀번호 재설정에 실패했어.');
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
        <h1 className={styles.title}>비밀번호 재설정</h1>
        <p className={styles.subtitle}>새로 사용할 비밀번호를 입력해줘!</p>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <div className="form-group">
            <label className="form-label">이메일</label>
            <input
              {...register('email')}
              type="email"
              className="form-input"
              placeholder="가입했던 이메일을 입력해줘"
            />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">새 비밀번호</label>
            <input
              {...register('newPassword')}
              type="password"
              className="form-input"
              placeholder="새 비밀번호 입력"
            />
            {errors.newPassword && <p className="form-error">{errors.newPassword.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">새 비밀번호 확인</label>
            <input
              {...register('confirmPassword')}
              type="password"
              className="form-input"
              placeholder="새 비밀번호 다시 한 번 입력"
            />
            {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? '변경 중...' : '비밀번호 변경하기'}
          </button>
        </form>

        <p className={styles.footer} style={{ marginTop: '16px' }}>
          <Link href="/auth/login" className={styles.link}>← 로그인으로 돌아가기</Link>
        </p>
      </div>
    </div>
  );
}
