"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/* ── palette ── */
const C = {
  navy: "#0B0E2A",
  navyLight: "#151938",
  navyMid: "#1E2348",
  gold: "#FFD24C",
  goldDark: "#E5B800",
  blue: "#3B7DFF",
  blueLight: "#5E9AFF",
  cyan: "#00D4FF",
  orange: "#FF6B35",
  red: "#FF4757",
  green: "#2ED573",
  white: "#FFFFFF",
  gray50: "#F8F9FC",
  gray100: "#EEF0F6",
  gray200: "#D1D5E0",
  gray400: "#8B92A8",
  gray600: "#5A6078",
  dark: "#12152B",
};

const SEGMENTS = [
  { id: "k12", label: "초·중·고", icon: "📚", color: "#5E9AFF", tagline: "교과 전 과목 AI 학습", desc: "수학, 영어, 과학, 역사 등 교과서 기반 맞춤 학습. 모르는 문제를 사진으로 질문하면 단계별로 풀이해 드려요.", tone: "친근하고 격려하는 선생님 말투", subjects: ["수학","영어","과학","역사","사회","국어"], badge: "학부모 추천 1위" },
  { id: "univ", label: "대학생", icon: "🎓", color: "#A78BFA", tagline: "전공 심화 & 취업 올인원", desc: "코딩테스트, 자소서·면접 준비, 토익·오픽, 데이터 분석까지. 취업 성공을 위한 선배형 AI 멘토.", tone: "선배 같은 멘토 말투", subjects: ["코딩테스트","토익/오픽","자소서","면접","데이터분석","JLPT"], badge: "취준생 필수" },
  { id: "worker", label: "직장인", icon: "💼", color: "#34D399", tagline: "실무 역량 즉시 업그레이드", desc: "ChatGPT·Claude 활용, Python 자동화, 비즈니스 영어, 보고서 작성 등 현업 밀착형 AI 코칭.", tone: "현업 전문가 말투", subjects: ["AI 활용","Python","비즈니스 영어","보고서","Excel","SQL"], badge: "야근 탈출" },
  { id: "cert", label: "자격증", icon: "📝", color: "#F59E0B", tagline: "합격률을 높이는 AI 전략 학습", desc: "정보처리기사, 공인중개사, 전기기사 등 핵심 요약 + 기출 풀이. 합격에 최적화된 전략형 학습.", tone: "합격 전략형 말투", subjects: ["정보처리기사","공인중개사","전기기사","빅데이터분석기사","컴활","요양보호사"], badge: "합격 보장" },
  { id: "senior", label: "시니어", icon: "🌿", color: "#FB7185", tagline: "쉽고 편한 디지털 생활 교육", desc: "스마트폰 사용법, 건강 정보, 취미 활동까지. 큰 글씨, 쉬운 말로 천천히 설명해 드려요.", tone: "쉽고 따뜻한 말투", subjects: ["스마트폰","건강","디지털 생활","취미"], badge: "쉬운 설명" },
  { id: "global", label: "글로벌 한국어", icon: "🌏", color: "#38BDF8", tagline: "Learn Korean with AI Tutor", desc: "기초부터 TOPIK 대비까지. 전 세계 학습자를 위한 한국어 AI 교육 서비스.", tone: "다국어 지원", subjects: ["기초 한국어","회화","문법","TOPIK","읽기","쓰기"], badge: "Global" },
];

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setV(true);
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, v] as const;
}

function Reveal({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const [ref, v] = useInView();
  return (
    <div ref={ref} style={{ opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(28px)", transition: `all 0.6s ${delay}s cubic-bezier(.22,1,.36,1)`, ...style }}>
      {children}
    </div>
  );
}

/* ── Sticky Top Nav ── */
function TopNav({ activeTab, setActiveTab }: { activeTab: number; setActiveTab: (i: number) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  const tabs = ["서비스 소개","학습 대상","학습 혜택","이용 후기","시작하기"];
  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, background: scrolled ? "rgba(11,14,42,0.97)" : "transparent", backdropFilter: scrolled ? "blur(12px)" : "none", borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "none", transition: "all 0.3s" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${C.blue}, ${C.cyan})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 15 }}>N</div>
          <span style={{ fontWeight: 900, fontSize: 18, color: C.white, letterSpacing: "-0.02em" }}>누리캠퍼스</span>
          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: C.gold, color: C.navy, fontWeight: 800, marginLeft: 4 }}>OPEN</span>
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {tabs.map((t, i) => (
            <button key={i} onClick={() => { setActiveTab(i); document.getElementById(`section-${i}`)?.scrollIntoView({ behavior: "smooth" }); }}
              style={{ padding: "8px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit", background: activeTab === i ? "rgba(59,125,255,0.2)" : "transparent", color: activeTab === i ? C.blueLight : "rgba(255,255,255,0.6)", transition: "all 0.2s" }}>
              {t}
            </button>
          ))}
          <button
            onClick={() => router.push("/auth/login")}
            style={{ marginLeft: 8, padding: "9px 18px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", background: "transparent", color: "rgba(255,255,255,0.8)", transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            로그인
          </button>
          <button
            onClick={() => router.push("/auth/signup")}
            style={{ marginLeft: 4, padding: "9px 22px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 800, fontFamily: "inherit", background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, color: C.navy, transition: "all 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.04)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}>
            무료 체험 →
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ── Hero ── */
function Hero() {
  const router = useRouter();
  return (
    <section id="section-0" style={{ minHeight: "100vh", background: `radial-gradient(ellipse at 50% 20%, ${C.navyMid} 0%, ${C.navy} 60%, #050714 100%)`, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "100px 24px 60px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`, backgroundSize: "80px 80px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "10%", left: "20%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,125,255,0.12) 0%, transparent 70%)", pointerEvents: "none", filter: "blur(40px)" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "15%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,210,76,0.08) 0%, transparent 70%)", pointerEvents: "none", filter: "blur(40px)" }} />

      <Reveal>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 100, background: "rgba(255,210,76,0.12)", border: "1px solid rgba(255,210,76,0.25)", marginBottom: 24 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>지금 무료 체험 가능</span>
        </div>
      </Reveal>

      <Reveal delay={0.08}>
        <h1 style={{ fontSize: "clamp(32px, 5.5vw, 62px)", fontWeight: 900, lineHeight: 1.15, color: C.white, letterSpacing: "-0.03em", maxWidth: 800 }}>
          모든 학습의 시작,<br />
          <span style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI 선생님</span>이 24시간 대기 중
        </h1>
      </Reveal>

      <Reveal delay={0.16}>
        <p style={{ fontSize: "clamp(15px, 1.8vw, 19px)", color: "rgba(255,255,255,0.55)", maxWidth: 520, lineHeight: 1.75, marginTop: 20 }}>
          초·중·고부터 대학생, 직장인, 자격증, 시니어까지<br />
          내 수준에 맞는 설명으로 즉시 학습하세요.
        </p>
      </Reveal>

      <Reveal delay={0.24}>
        <div style={{ display: "flex", gap: 12, marginTop: 36, flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={() => router.push("/auth/signup")}
            style={{ padding: "16px 36px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 17, fontWeight: 800, fontFamily: "inherit", background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, color: C.navy, boxShadow: "0 8px 32px rgba(255,210,76,0.3)", transition: "all 0.25s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(255,210,76,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(255,210,76,0.3)"; }}>
            무료 체험 시작하기 →
          </button>
          <button
            onClick={() => document.getElementById("section-1")?.scrollIntoView({ behavior: "smooth" })}
            style={{ padding: "16px 28px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", fontSize: 15, fontWeight: 600, fontFamily: "inherit", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.8)", transition: "all 0.25s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}>
            서비스 둘러보기
          </button>
        </div>
      </Reveal>

      <Reveal delay={0.35}>
        <div style={{ display: "flex", gap: 1, marginTop: 60, borderRadius: 16, overflow: "hidden", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {[
            { num: "24/7", label: "학습 가능" },
            { num: "6+", label: "학습 대상" },
            { num: "30+", label: "과목·주제" },
            { num: "100%", label: "맞춤 설명" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "20px 32px", textAlign: "center", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <div style={{ fontSize: 24, fontWeight: 900, background: `linear-gradient(135deg, ${C.gold}, ${C.cyan})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{s.num}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ── Problem ── */
function ProblemSection() {
  const problems = [
    { emoji: "😩", q: "이 문제 어떻게 풀지…", desc: "막히는 순간 물어볼 사람이 없어 혼자 끙끙대다 포기하게 돼요." },
    { emoji: "💸", q: "과외비가 너무 부담돼요", desc: "월 수십만 원의 과외·학원비, 매달 감당하기 힘들어요." },
    { emoji: "⏰", q: "밤 11시엔 질문할 데가 없어", desc: "가장 집중되는 시간에 선생님은 이미 퇴근했어요." },
  ];
  return (
    <section style={{ padding: "100px 24px", background: C.gray50 }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center" }}>
            <span style={{ display: "inline-block", padding: "6px 16px", borderRadius: 100, fontSize: 13, fontWeight: 700, background: "#FEE2E2", color: C.red }}>혹시 이런 경험 있으신가요?</span>
            <h2 style={{ fontSize: "clamp(26px, 3.8vw, 40px)", fontWeight: 900, color: C.dark, marginTop: 16, lineHeight: 1.3 }}>
              공부할 때 가장 힘든 순간,<br />바로 <span style={{ color: C.orange }}>질문할 수 없는 순간</span>입니다.
            </h2>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 48 }}>
          {problems.map((p, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div style={{ padding: 32, borderRadius: 16, background: C.white, border: `1px solid ${C.gray100}`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 40 }}>{p.emoji}</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: C.dark, marginTop: 14 }}>"{p.q}"</h3>
                <p style={{ fontSize: 14, color: C.gray600, marginTop: 10, lineHeight: 1.7 }}>{p.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Segment Tabs ── */
function SegmentSection() {
  const [active, setActive] = useState(0);
  // SEGMENTS always has 6 items; active is always in [0,5]
  const s = SEGMENTS[active]!;
  const router = useRouter();
  return (
    <section id="section-1" style={{ padding: "100px 24px", background: C.navy, position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${C.blue}, ${C.cyan}, ${C.gold}, ${C.orange})` }} />
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center" }}>
            <span style={{ display: "inline-block", padding: "6px 16px", borderRadius: 100, fontSize: 13, fontWeight: 700, background: "rgba(59,125,255,0.15)", color: C.blueLight }}>학습 대상별 맞춤 서비스</span>
            <h2 style={{ fontSize: "clamp(26px, 3.8vw, 40px)", fontWeight: 900, color: C.white, marginTop: 16, lineHeight: 1.3 }}>
              나에게 딱 맞는 <span style={{ color: C.gold }}>AI 선생님</span>을 만나보세요
            </h2>
          </div>
        </Reveal>

        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 40, flexWrap: "wrap" }}>
          {SEGMENTS.map((seg, i) => (
            <button key={i} onClick={() => setActive(i)}
              style={{ padding: "12px 22px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "inherit", background: active === i ? seg.color : "rgba(255,255,255,0.06)", color: active === i ? C.white : "rgba(255,255,255,0.5)", transition: "all 0.25s", boxShadow: active === i ? `0 4px 20px ${seg.color}44` : "none" }}>
              <span style={{ marginRight: 6 }}>{seg.icon}</span>{seg.label}
            </button>
          ))}
        </div>

        <div key={active} style={{ marginTop: 32, borderRadius: 20, overflow: "hidden", background: C.navyLight, border: `1px solid ${s.color}33`, animation: "fadeIn 0.35s ease" }}>
          <div style={{ height: 4, background: `linear-gradient(90deg, ${s.color}, ${s.color}88)` }} />
          <div style={{ padding: "40px 40px 36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ fontSize: 42 }}>{s.icon}</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h3 style={{ fontSize: 24, fontWeight: 900, color: C.white }}>{s.tagline}</h3>
                  <span style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 800, background: `${s.color}22`, color: s.color, border: `1px solid ${s.color}44` }}>{s.badge}</span>
                </div>
                <p style={{ fontSize: 13, color: s.color, fontWeight: 600, marginTop: 4 }}>AI 말투: {s.tone}</p>
              </div>
            </div>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", marginTop: 20, lineHeight: 1.8, maxWidth: 600 }}>{s.desc}</p>
            <div style={{ display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap" }}>
              {s.subjects.map(sub => (
                <span key={sub} style={{ padding: "7px 14px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{sub}</span>
              ))}
            </div>
            <button
              onClick={() => router.push("/auth/signup")}
              style={{ marginTop: 28, padding: "13px 28px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 800, fontFamily: "inherit", background: s.color, color: C.white, boxShadow: `0 4px 16px ${s.color}44`, transition: "all 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
              {s.label} 학습 시작하기 →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Features ── */
function FeaturesSection() {
  const features = [
    { icon: "💬", title: "질문하면 즉시 설명", desc: "막힌 문제, 모르는 개념을 바로 물어보세요. AI가 단계별로 쉽게 풀어드려요.", color: C.blue },
    { icon: "🎯", title: "대상별 맞춤 말투", desc: "초등학생에겐 친근하게, 직장인에겐 실무 중심으로. 같은 AI, 다른 경험.", color: C.gold },
    { icon: "📊", title: "학습 진행 자동 분석", desc: "어디가 약한지, 얼마나 성장했는지 Smart Analytics로 자동 추적.", color: C.green },
    { icon: "🌙", title: "24시간 언제든지", desc: "새벽 2시에도, 주말에도. 시간 제약 없이 원할 때 즉시 학습 가능.", color: C.cyan },
    { icon: "🔄", title: "반복 학습 & 피드백", desc: "틀린 문제 자동 복습, 취약점 보완 피드백까지 디지털 학습 파트너.", color: C.orange },
    { icon: "🌍", title: "전 생애주기 학습", desc: "초등학생부터 시니어, 글로벌 한국어 학습자까지 모든 연령 지원.", color: "#A78BFA" },
  ];
  return (
    <section id="section-2" style={{ padding: "100px 24px", background: C.white }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center" }}>
            <span style={{ display: "inline-block", padding: "6px 16px", borderRadius: 100, fontSize: 13, fontWeight: 700, background: "#DBEAFE", color: C.blue }}>누리캠퍼스만의 학습 혜택</span>
            <h2 style={{ fontSize: "clamp(26px, 3.8vw, 40px)", fontWeight: 900, color: C.dark, marginTop: 16, lineHeight: 1.3 }}>
              단순 챗봇이 아닌, <span style={{ color: C.blue }}>진짜 AI 선생님</span>
            </h2>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, marginTop: 48 }}>
          {features.map((f, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <div style={{ padding: 28, borderRadius: 16, background: C.gray50, border: `1px solid ${C.gray100}`, transition: "all 0.25s", cursor: "default" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = f.color + "66"; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px ${f.color}15`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.gray100; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: f.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{f.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: C.dark, marginTop: 16 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: C.gray600, marginTop: 8, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials ── */
function TestimonialsSection() {
  const reviews = [
    { text: "밤늦게 수학 풀다가 막혔는데, 단계별로 풀이해줘서 과외 없이도 성적이 올랐어요.", who: "고2 학생", tag: "수학", color: C.blue },
    { text: "코딩테스트 준비하면서 모르는 알고리즘 바로 물어볼 수 있어서 효율이 배로 늘었습니다.", who: "대학교 3학년", tag: "코딩테스트", color: "#A78BFA" },
    { text: "보고서 쓸 때 표현이 막히면 즉시 도움받아요. 야근이 확실히 줄었습니다.", who: "IT 기업 대리", tag: "보고서 작성", color: C.green },
    { text: "정보처리기사 필기 한 번에 붙었습니다. 기출 풀이 해설이 정말 명확해요.", who: "자격증 합격생", tag: "정보처리기사", color: C.gold },
  ];
  return (
    <section id="section-3" style={{ padding: "100px 24px", background: C.gray50 }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center" }}>
            <span style={{ display: "inline-block", padding: "6px 16px", borderRadius: 100, fontSize: 13, fontWeight: 700, background: "#FEF3C7", color: C.goldDark }}>이용 후기</span>
            <h2 style={{ fontSize: "clamp(26px, 3.8vw, 40px)", fontWeight: 900, color: C.dark, marginTop: 16, lineHeight: 1.3 }}>
              학습자들이 직접 경험한 <span style={{ color: C.orange }}>누리캠퍼스</span>
            </h2>
          </div>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginTop: 48 }}>
          {reviews.map((r, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div style={{ padding: 28, borderRadius: 16, background: C.white, border: `1px solid ${C.gray100}`, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 180 }}>
                <div>
                  <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
                    {"★★★★★".split("").map((s, j) => <span key={j} style={{ color: C.gold, fontSize: 16 }}>{s}</span>)}
                  </div>
                  <p style={{ fontSize: 15, color: C.dark, lineHeight: 1.75 }}>"{r.text}"</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
                  <span style={{ fontSize: 13, color: C.gray400, fontWeight: 600 }}>— {r.who}</span>
                  <span style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: r.color + "15", color: r.color }}>{r.tag}</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Event Banner ── */
function EventBanner() {
  const router = useRouter();
  return (
    <section style={{ padding: "0 24px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", borderRadius: 20, overflow: "hidden", background: `linear-gradient(135deg, ${C.navyMid} 0%, ${C.navy} 100%)`, border: "1px solid rgba(255,210,76,0.2)", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${C.gold}, ${C.orange}, ${C.gold})` }} />
        <div style={{ padding: "48px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 6, background: C.red, marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: C.white }}>🔥 EVENT</span>
            </div>
            <h3 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 900, color: C.white, lineHeight: 1.3 }}>
              지금 가입하면<br />
              <span style={{ color: C.gold }}>프리미엄 7일 무료 체험</span>
            </h3>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 10 }}>신용카드 없이 시작 · 자동 결제 없음 · 언제든 해지</p>
          </div>
          <button
            onClick={() => router.push("/auth/signup")}
            style={{ padding: "18px 40px", borderRadius: 14, border: "none", cursor: "pointer", fontSize: 18, fontWeight: 900, fontFamily: "inherit", background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, color: C.navy, boxShadow: `0 8px 32px rgba(255,210,76,0.35)`, transition: "all 0.25s", whiteSpace: "nowrap" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = `0 12px 40px rgba(255,210,76,0.45)`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = `0 8px 32px rgba(255,210,76,0.35)`; }}>
            무료 체험 시작 →
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ── */
function FinalCTA() {
  const router = useRouter();
  return (
    <section id="section-4" style={{ padding: "120px 24px", background: C.navy, textAlign: "center", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 50%, rgba(59,125,255,0.1) 0%, transparent 60%)`, pointerEvents: "none" }} />
      <Reveal>
        <h2 style={{ fontSize: "clamp(28px, 4.5vw, 50px)", fontWeight: 900, color: C.white, lineHeight: 1.2, position: "relative" }}>
          혼자 공부해도<br />
          <span style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>옆에 선생님이 있는 것처럼</span>
        </h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.45)", marginTop: 16, lineHeight: 1.7 }}>
          누리캠퍼스와 함께 새로운 학습을 시작하세요.
        </p>
        <button
          onClick={() => router.push("/auth/signup")}
          style={{ marginTop: 36, padding: "18px 48px", borderRadius: 14, border: "none", cursor: "pointer", fontSize: 18, fontWeight: 900, fontFamily: "inherit", background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, color: C.navy, boxShadow: "0 8px 32px rgba(255,210,76,0.3)", transition: "all 0.25s" }}
          onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-3px)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
          지금 무료로 시작하기 →
        </button>
      </Reveal>
    </section>
  );
}

/* ── Footer ── */
function Footer() {
  return (
    <footer style={{ padding: "40px 24px", background: "#060818", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: `linear-gradient(135deg, ${C.blue}, ${C.cyan})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 10 }}>N</div>
            <span style={{ fontWeight: 800, fontSize: 14, color: "rgba(255,255,255,0.6)" }}>누리캠퍼스</span>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>AI 기반 맞춤형 학습 플랫폼 · 모든 연령, 모든 목표</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>문의: admin@nuricampus.com</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", marginTop: 4 }}>© 2026 NuriCampus. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

/* ── App ── */
export default function LandingPage() {
  const [activeTab, setActiveTab] = useState(0);
  return (
    <div style={{ fontFamily: "'Pretendard', 'Apple SD Gothic Neo', -apple-system, sans-serif", WebkitFontSmoothing: "antialiased" }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        * { margin:0; padding:0; box-sizing:border-box; }
        html { scroll-behavior: smooth; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
      <TopNav activeTab={activeTab} setActiveTab={setActiveTab} />
      <Hero />
      <ProblemSection />
      <SegmentSection />
      <FeaturesSection />
      <TestimonialsSection />
      <EventBanner />
      <div style={{ height: 80, background: C.gray50 }} />
      <FinalCTA />
      <Footer />
    </div>
  );
}
