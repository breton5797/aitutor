"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";

const C = {
  navy: "#0B0E2A",
  navyLight: "#151938",
  gold: "#FFD24C",
  orange: "#FF6B35",
  blue: "#3B7DFF",
  cyan: "#00D4FF",
  green: "#2ED573",
  white: "#FFFFFF",
  gray50: "#F8F9FC",
  gray400: "#8B92A8",
  dark: "#12152B",
};

const PLANS = [
  {
    id: "FREE",
    name: "무료",
    price: "0원",
    period: "",
    dailyLimit: 5,
    color: C.gray400,
    features: [
      "하루 5회 AI 응답",
      "기본 4개 과목 (수학·영어·과학·국어)",
      "텍스트 기반 학습",
      "학습 기록 저장",
    ],
    cta: "현재 플랜",
    highlight: false,
  },
  {
    id: "BASIC",
    name: "BASIC",
    price: "69,000원",
    period: "/월",
    dailyLimit: 100,
    color: C.blue,
    features: [
      "하루 100회 AI 응답",
      "전 과목 학습 가능",
      "음성 대화 (마이크 모드)",
      "이미지·사진 문제 풀이",
      "학습 리포트",
    ],
    cta: "BASIC 시작하기",
    highlight: false,
    badge: "인기",
  },
  {
    id: "PREMIUM",
    name: "PREMIUM",
    price: "259,000원",
    period: "/월",
    dailyLimit: 500,
    color: C.gold,
    features: [
      "하루 500회 AI 응답",
      "전 과목 + 자격증·취업 특화",
      "음성 대화 우선 처리",
      "이미지 분석 우선 처리",
      "학부모 리포트 공유",
      "1:1 학습 컨설팅 (월 1회)",
    ],
    cta: "PREMIUM 시작하기",
    highlight: true,
    badge: "최고 혜택",
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState<string>("FREE");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/billing/status")
      .then((r) => setCurrentPlan(r.data.planType || "FREE"))
      .catch(() => setCurrentPlan("FREE"))
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = (planId: string) => {
    if (planId === "FREE" || planId === currentPlan) return;
    // Payup 키 수령 후 결제창 연동 예정
    alert(`Payup 결제 연동 준비 중입니다.\n곧 ${planId} 플랜으로 업그레이드하실 수 있습니다!`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(ellipse at 50% 0%, #1E2348 0%, ${C.navy} 60%, #050714 100%)`,
        fontFamily: "'Pretendard', -apple-system, sans-serif",
        padding: "80px 24px 60px",
      }}
    >
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* 헤더 */}
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <button
          onClick={() => router.back()}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 14, marginBottom: 24, display: "block", margin: "0 auto 24px" }}
        >
          ← 뒤로
        </button>
        <span style={{ display: "inline-block", padding: "5px 14px", borderRadius: 100, background: "rgba(255,210,76,0.12)", border: "1px solid rgba(255,210,76,0.25)", fontSize: 12, fontWeight: 700, color: C.gold, marginBottom: 16 }}>
          요금제 선택
        </span>
        <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: C.white, lineHeight: 1.2 }}>
          나에게 맞는 플랜을{" "}
          <span style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            선택하세요
          </span>
        </h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", marginTop: 12 }}>
          언제든 업그레이드 · 해지 가능 · 자동 결제 없음
        </p>
      </div>

      {/* 플랜 카드 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
          maxWidth: 960,
          margin: "0 auto",
        }}
      >
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isHighlight = plan.highlight;
          return (
            <div
              key={plan.id}
              style={{
                borderRadius: 20,
                overflow: "hidden",
                background: isHighlight ? `linear-gradient(145deg, #1c1f40, #12152e)` : "rgba(255,255,255,0.04)",
                border: `1px solid ${isCurrent ? C.green : isHighlight ? plan.color + "66" : "rgba(255,255,255,0.08)"}`,
                boxShadow: isHighlight ? `0 8px 40px ${plan.color}22` : "none",
                position: "relative",
                transform: isHighlight ? "scale(1.03)" : "scale(1)",
                transition: "transform 0.2s",
              }}
            >
              {/* 상단 강조 바 */}
              <div style={{ height: 3, background: `linear-gradient(90deg, ${plan.color}, ${plan.color}88)` }} />

              {/* 뱃지 */}
              {plan.badge && (
                <div style={{ position: "absolute", top: 16, right: 16, padding: "3px 10px", borderRadius: 6, background: plan.color, color: plan.id === "PREMIUM" ? C.dark : C.white, fontSize: 11, fontWeight: 800 }}>
                  {plan.badge}
                </div>
              )}
              {isCurrent && (
                <div style={{ position: "absolute", top: 16, left: 16, padding: "3px 10px", borderRadius: 6, background: C.green + "22", border: `1px solid ${C.green}55`, color: C.green, fontSize: 11, fontWeight: 800 }}>
                  현재 플랜
                </div>
              )}

              <div style={{ padding: "32px 28px 28px" }}>
                {/* 플랜명 */}
                <p style={{ fontSize: 13, fontWeight: 700, color: plan.color, marginBottom: 8 }}>{plan.name}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: C.white }}>{plan.price}</span>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>{plan.period}</span>
                </div>
                <p style={{ fontSize: 13, color: plan.color, fontWeight: 600, marginBottom: 24 }}>
                  하루 {plan.dailyLimit}회 AI 응답
                </p>

                {/* 기능 목록 */}
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
                      <span style={{ color: plan.color, flexShrink: 0, marginTop: 1 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA 버튼 */}
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrent || loading}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: 12,
                    cursor: isCurrent ? "default" : "pointer",
                    fontSize: 15,
                    fontWeight: 800,
                    fontFamily: "inherit",
                    background: isCurrent
                      ? "rgba(46,213,115,0.15)"
                      : isHighlight
                      ? `linear-gradient(135deg, ${C.gold}, ${C.orange})`
                      : plan.id === "FREE"
                      ? "rgba(255,255,255,0.06)"
                      : `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`,
                    color: isCurrent ? C.green : isHighlight ? C.dark : C.white,
                    border: isCurrent ? `1px solid ${C.green}44` : "none",
                    transition: "all 0.2s",
                    opacity: loading ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
                >
                  {isCurrent ? "✓ 현재 사용 중" : plan.cta}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: 640, margin: "60px auto 0", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", lineHeight: 1.8 }}>
          결제 관련 문의: <a href="mailto:admin@nuricampus.com" style={{ color: "rgba(255,255,255,0.4)" }}>admin@nuricampus.com</a><br />
          신용카드 없이 시작 가능 · 언제든 해지 가능 · 환불 정책: 구독 후 7일 이내 전액 환불
        </p>
      </div>
    </div>
  );
}
