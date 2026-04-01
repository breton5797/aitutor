'use client';

import Link from 'next/link';
import styles from './landing.module.css';

import { useLanguageStore } from '../lib/store';
import { TRANSLATIONS, LANGUAGES, SupportedLanguage } from '../lib/i18n';
import { SEGMENTS } from '../config/segments';

const features = (t: any) => [
  {
    emoji: '🤖',
    title: '24/7 AI Tutor',
    desc: 'Answers anytime.',
  },
  {
    emoji: '📚',
    title: 'Personalized',
    desc: 'Tailored explanations.',
  },
  {
    emoji: '📈',
    title: 'Smart Analytics',
    desc: 'Tracks your progress.',
  },
];

// Removed static subjects

export default function LandingPage() {
  const { lang, setLang } = useLanguageStore();
  const t = TRANSLATIONS[lang];

  return (
    <div className={styles.container}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>
          <span className={styles.logoIcon}>🎓</span>
          <span className={styles.logoText}>AI Tutor</span>
        </div>
        <div className={styles.navLinks}>
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value as SupportedLanguage)}
            className="select select-bordered select-sm mr-2"
          >
            {Object.entries(LANGUAGES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <Link href="/auth/login" className="btn btn-ghost btn-sm">{t.nav_login}</Link>
          <Link href="/auth/signup" className="btn btn-primary btn-sm">{t.nav_signup}</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <span>{t.hero_badge}</span>
        </div>
        <h1 className={styles.heroTitle}>
          {t.hero_title1}<br />
          <span className="gradient-text">{t.hero_title2}</span><br />
          {t.hero_title3}
        </h1>
        <p className={styles.heroDesc}>
          {t.hero_desc}
        </p>
        <div className={styles.heroButtons}>
          <Link href="/auth/signup" className="btn btn-primary btn-lg">
            {t.hero_btn_free}
          </Link>
          <Link href="/auth/login" className="btn btn-ghost btn-lg">
            {t.nav_login}
          </Link>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.stat}>
            <span className={styles.statNumber}>4</span>
            <span className={styles.statLabel}>{t.stat_subjects}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNumber}>24/7</span>
            <span className={styles.statLabel}>{t.stat_anytime}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNumber}>AI</span>
            <span className={styles.statLabel}>{t.stat_tutor}</span>
          </div>
        </div>
      </section>

      {/* Segments */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>학습 연령/목적 선택 (Segments)</h2>
        <p className={styles.sectionDesc}>원하는 학습 대상을 선택하여 특화된 AI 튜터를 만나보세요.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', padding: '0 20px', maxWidth: '1000px', margin: '0 auto' }}>
          {Object.values(SEGMENTS).map((seg) => (
            <Link href={`/${seg.id}`} key={seg.id} style={{
              backgroundColor: seg.bgColor,
              borderRadius: '16px',
              padding: '24px',
              textDecoration: 'none',
              color: '#333',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              border: `2px solid transparent`,
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.borderColor = seg.accentColor)}
            onMouseOut={(e) => (e.currentTarget.style.borderColor = 'transparent')}
            >
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: seg.accentColor, marginBottom: '8px' }}>
                {seg.targetAge}
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>{seg.name}</h3>
              <p style={{ fontSize: '14px', color: '#555', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                {seg.description}
              </p>
              <button style={{
                backgroundColor: seg.accentColor,
                color: seg.textOnAccent,
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                width: '100%'
              }}>시작하기</button>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.sec_why_title}</h2>
        <p className={styles.sectionDesc}>{t.sec_why_desc}</p>
        <div className={styles.featuresGrid}>
          {features(t).map((f, i) => (
            <div key={i} className={styles.featureCard}>
              <div className={styles.featureEmoji}>{f.emoji}</div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Chat Demo */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.sec_demo_title}</h2>
        <div className={styles.chatDemo}>
          <div className={styles.chatDemoHeader}>
            <span className={styles.chatDemoSubject}>📐 Math</span>
          </div>
          <div className={styles.chatDemoBody}>
            <div className={styles.chatBubbleUser}>
              y = ax² + bx + c 😭
            </div>
            <div className={styles.chatBubbleAi}>
              <div className={styles.chatAiAvatar}>🎓</div>
              <div className={styles.chatAiContent}>
                <p>Don't worry! Let's solve it together 😊</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <h2 className={styles.ctaTitle}>{t.cta_title}</h2>
          <p className={styles.ctaDesc}>{t.cta_desc}</p>
          <Link href="/auth/signup" className="btn btn-primary btn-lg">
            {t.cta_btn}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLogo}>
          <span>🎓</span>
          <span>AI Tutor</span>
        </div>
        <p className={styles.footerCopy}>{t.footer_copy}</p>
      </footer>
    </div>
  );
}
