'use client';

import Link from 'next/link';
import styles from './landing.module.css';

import { useLanguageStore } from '../lib/store';
import { TRANSLATIONS, LANGUAGES, SupportedLanguage } from '../lib/i18n';

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

const subjects = [
  { name: '영어', emoji: '📖', color: '#67e8f9', desc: '문법·독해·작문' },
  { name: '수학', emoji: '📐', color: '#fcd34d', desc: '개념·문제풀이' },
  { name: '과학', emoji: '🔬', color: '#6ee7b7', desc: '개념·원리·실험' },
  { name: '역사', emoji: '📜', color: '#fca5a5', desc: '흐름·사건·인물' },
];

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

      {/* Subjects */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.sec_subjects_title}</h2>
        <p className={styles.sectionDesc}>{t.sec_subjects_desc}</p>
        <div className={styles.subjectGrid}>
          {subjects.map((s) => (
            <div key={s.name} className={styles.subjectCard} style={{ '--subject-color': s.color } as React.CSSProperties}>
              <div className={styles.subjectEmoji}>{s.emoji}</div>
              <div className={styles.subjectName}>{s.name}</div>
            </div>
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
