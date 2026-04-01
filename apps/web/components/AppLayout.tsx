'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../lib/store';
import styles from './AppLayout.module.css';

const navItems = [
  { href: '/dashboard', label: '홈', emoji: '🏠' },
  { href: '/chat', label: '채팅', emoji: '💬' },
  { href: '/history', label: '학습기록', emoji: '📊' },
  { href: '/reports', label: '부모용 리포트', emoji: '📈' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth, isAdmin } = useAuthStore();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (user) {
      import('../lib/api').then(({ default: api }) => {
        api.get('/stats').then(res => setStats(res.data)).catch(console.error);
      });
    }
  }, [user]);

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <Link href="/dashboard" className={styles.logo}>
            <span>🎓</span>
            <span className={styles.logoText}>AI Tutor</span>
          </Link>

          <div className={styles.userCard}>
            <div className={styles.userAvatar}>{user?.name?.[0] || '?'}</div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user?.name}</div>
              <div className={styles.userGrade}>
                Lv.{stats?.level || 1} • {stats?.xp || 0} XP
              </div>
            </div>
          </div>

          <div className={styles.streakCard}>
            🔥 연속 학습: {stats?.streakDays || 1}일 째
          </div>

          <nav className={styles.nav}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${pathname.startsWith(item.href) ? styles.active : ''}`}
              >
                <span className={styles.navEmoji}>{item.emoji}</span>
                <span>{item.label}</span>
              </Link>
            ))}
            {isAdmin() && (
              <Link
                href="/admin"
                className={`${styles.navItem} ${pathname.startsWith('/admin') ? styles.active : ''}`}
              >
                <span className={styles.navEmoji}>⚙️</span>
                <span>관리자</span>
              </Link>
            )}
          </nav>
        </div>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          <span>🚪</span>
          <span>로그아웃</span>
        </button>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className={styles.mobileNav}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.mobileNavItem} ${pathname.startsWith(item.href) ? styles.mobileActive : ''}`}
          >
            <span>{item.emoji}</span>
            <span>{item.label}</span>
          </Link>
        ))}
        {isAdmin() && (
          <Link
            href="/admin"
            className={`${styles.mobileNavItem} ${pathname.startsWith('/admin') ? styles.mobileActive : ''}`}
          >
            <span>⚙️</span>
            <span>관리자</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
