'use client';

import Link from 'next/link';
import styles from './landing.module.css';

const features = [
  {
    emoji: '🤖',
    title: '24시간 AI 튜터',
    desc: '언제든지 질문하면 바로 답해줘. 밤 12시에도, 아침 6시에도 항상 옆에 있어.',
  },
  {
    emoji: '📚',
    title: '4과목 맞춤 설명',
    desc: '영어·수학·과학·역사를 각 과목 특성에 맞게, 네 수준에 딱 맞춰 설명해줘.',
  },
  {
    emoji: '📈',
    title: '학습 기록 & 추천',
    desc: '네가 질문한 내용을 기억하고, 다음에 뭘 공부하면 좋을지 추천해줄게.',
  },
];

const subjects = [
  { name: '영어', emoji: '📖', color: '#67e8f9', desc: '문법·독해·작문' },
  { name: '수학', emoji: '📐', color: '#fcd34d', desc: '개념·문제풀이' },
  { name: '과학', emoji: '🔬', color: '#6ee7b7', desc: '개념·원리·실험' },
  { name: '역사', emoji: '📜', color: '#fca5a5', desc: '흐름·사건·인물' },
];

export default function LandingPage() {
  return (
    <div className={styles.container}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navLogo}>
          <span className={styles.logoIcon}>🎓</span>
          <span className={styles.logoText}>AI Tutor</span>
        </div>
        <div className={styles.navLinks}>
          <Link href="/auth/login" className="btn btn-ghost btn-sm">로그인</Link>
          <Link href="/auth/signup" className="btn btn-primary btn-sm">시작하기</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <span>✨</span>
          <span>AI 기반 개인 맞춤 학습</span>
        </div>
        <h1 className={styles.heroTitle}>
          혼자 공부해도<br />
          <span className="gradient-text">옆에 선생님이 있는</span><br />
          것처럼
        </h1>
        <p className={styles.heroDesc}>
          질문하면 바로 설명해주는 AI 튜터.<br />
          영어·수학·과학·역사 맞춤 학습을 지금 시작해봐.
        </p>
        <div className={styles.heroButtons}>
          <Link href="/auth/signup" className="btn btn-primary btn-lg">
            무료로 시작하기 →
          </Link>
          <Link href="/auth/login" className="btn btn-ghost btn-lg">
            로그인
          </Link>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.stat}>
            <span className={styles.statNumber}>4개</span>
            <span className={styles.statLabel}>지원 과목</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNumber}>24/7</span>
            <span className={styles.statLabel}>언제든지</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNumber}>AI</span>
            <span className={styles.statLabel}>친근한 튜터</span>
          </div>
        </div>
      </section>

      {/* Subjects */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>4과목 완벽 지원</h2>
        <p className={styles.sectionDesc}>각 과목 특성에 맞게 최적화된 AI 튜터가 기다리고 있어</p>
        <div className={styles.subjectGrid}>
          {subjects.map((s) => (
            <div key={s.name} className={styles.subjectCard} style={{ '--subject-color': s.color } as React.CSSProperties}>
              <div className={styles.subjectEmoji}>{s.emoji}</div>
              <div className={styles.subjectName}>{s.name}</div>
              <div className={styles.subjectDesc}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>왜 AI Tutor일까?</h2>
        <p className={styles.sectionDesc}>단순한 챗봇이 아닌, 진짜 공부를 도와주는 AI 선생님</p>
        <div className={styles.featuresGrid}>
          {features.map((f, i) => (
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
        <h2 className={styles.sectionTitle}>이런 식으로 공부해봐</h2>
        <div className={styles.chatDemo}>
          <div className={styles.chatDemoHeader}>
            <span className={styles.chatDemoSubject}>📐 수학</span>
          </div>
          <div className={styles.chatDemoBody}>
            <div className={styles.chatBubbleUser}>
              이차방정식 근의 공식 이해가 안 가요 😭
            </div>
            <div className={styles.chatBubbleAi}>
              <div className={styles.chatAiAvatar}>🎓</div>
              <div className={styles.chatAiContent}>
                <p>좋은 질문이야! 근의 공식이 처음엔 좀 복잡해 보일 수 있어. 천천히 같이 보자 😊</p>
                <p style={{ marginTop: 8 }}>
                  <strong>근의 공식: x = (-b ± √(b²-4ac)) / 2a</strong>
                </p>
                <p style={{ marginTop: 8 }}>이걸 이해하는 제일 좋은 방법은...</p>
                <p style={{ color: '#a5b4fc', marginTop: 4 }}>1단계: ax² + bx + c = 0에서 a, b, c를 찾아</p>
                <p style={{ color: '#a5b4fc' }}>2단계: 그 값을 공식에 대입해</p>
                <p style={{ marginTop: 8 }}>어디서 막혔는지 알려줘, 더 자세히 설명해줄게! 💪</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <h2 className={styles.ctaTitle}>지금 바로 시작해보자!</h2>
          <p className={styles.ctaDesc}>회원가입하고 AI 튜터랑 첫 번째 질문을 해봐 🚀</p>
          <Link href="/auth/signup" className="btn btn-primary btn-lg">
            무료 회원가입 →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLogo}>
          <span>🎓</span>
          <span>AI Tutor</span>
        </div>
        <p className={styles.footerCopy}>© 2024 AI Tutor MVP. 중고등학생을 위한 AI 개인 튜터.</p>
      </footer>
    </div>
  );
}
