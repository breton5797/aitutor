'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore, useLanguageStore } from '../../lib/store';
import { TRANSLATIONS, LANGUAGES, SupportedLanguage } from '../../lib/i18n';
import api from '../../lib/api';
import {
  Subject, SUBJECT_LABELS, SUBJECT_EMOJIS, SUBJECT_COLORS, SUBJECT_BG,
  LearningRecord, Recommendation, Conversation
} from '../../lib/types';
import AppLayout from '../../components/AppLayout';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getSegment, getSubject } from '../../config/segments';
import { SEGMENTS } from '../../config/segments';
import Script from 'next/script';

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [records, setRecords] = useState<LearningRecord[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [conversationList, setRecentConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { lang, setLang } = useLanguageStore();
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [recRes, recmRes, convRes] = await Promise.all([
        api.get('/learning/records'),
        api.get('/learning/recommendations'),
        api.get('/conversations'),
      ]);
      setRecords(recRes.data.records);
      setRecommendations(recmRes.data);
      setRecentConversations(convRes.data.slice(0, 5));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (subject: Subject) => {
    const res = await api.post('/conversations', { subject });
    router.push(`/chat/${res.data.id}`);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.greeting_morning;
    if (hour < 17) return t.greeting_afternoon;
    if (hour < 21) return t.greeting_evening;
    return t.greeting_night;
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #7F77DD', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#6b7280', fontWeight: 'bold' }}>{t.loading_chat || '불러오는 중...'}</p>
        </div>
      </AppLayout>
    );
  }

  const tailwindConfig = `
    tailwind.config = {
      darkMode: "class",
      corePlugins: { preflight: false },
      theme: {
        extend: {
          colors: {
            "surface-container-lowest": "#ffffff",
            "inverse-on-surface": "#f2efff",
            "tertiary": "#00694c",
            "tertiary-container": "#008560",
            "on-tertiary-fixed-variant": "#00513a",
            "on-secondary": "#ffffff",
            "outline-variant": "#c8c4d4",
            "primary-container": "#7067cc",
            "on-primary-fixed": "#140067",
            "surface-container-high": "#e8e5ff",
            "inverse-surface": "#2f2e43",
            "surface-dim": "#dad7f3",
            "on-background": "#1a1a2e",
            "on-secondary-fixed": "#191b26",
            "surface-container-highest": "#e2e0fc",
            "on-error": "#ffffff",
            "tertiary-fixed": "#86f8c9",
            "secondary-fixed-dim": "#c5c5d5",
            "surface": "#fcf8ff",
            "secondary": "#5d5d6b",
            "surface-variant": "#e2e0fc",
            "tertiary-fixed-dim": "#68dbae",
            "surface-bright": "#fcf8ff",
            "on-secondary-container": "#636371",
            "error": "#ba1a1a",
            "primary-fixed-dim": "#c5c0ff",
            "on-surface": "#1a1a2e",
            "primary-fixed": "#e4dfff",
            "secondary-fixed": "#e2e1f2",
            "surface-container-low": "#f5f2ff",
            "background": "#fcf8ff",
            "secondary-container": "#e2e1f2",
            "error-container": "#ffdad6",
            "outline": "#787583",
            "surface-tint": "#5951b4",
            "on-tertiary-fixed": "#002115",
            "surface-container": "#efecff",
            "on-tertiary": "#ffffff",
            "on-error-container": "#93000a",
            "on-secondary-fixed-variant": "#454653",
            "on-primary-container": "#fffbff",
            "on-primary": "#ffffff",
            "inverse-primary": "#c5c0ff",
            "primary": "#574eb1",
            "on-primary-fixed-variant": "#41379b",
            "on-surface-variant": "#474552",
            "on-tertiary-container": "#f5fff7"
          },
          fontFamily: {
            "headline": ["Manrope"],
            "body": ["Inter"],
            "label": ["Inter"]
          },
          borderRadius: {"DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "2xl": "1.5rem", "full": "9999px"},
        },
      },
    }
  `;

  return (
    <AppLayout>
      <Script src="https://cdn.tailwindcss.com?plugins=forms,container-queries" strategy="beforeInteractive" />
      <Script id="tailwind-config" strategy="beforeInteractive">{tailwindConfig}</Script>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .dash-container { font-family: 'Inter', sans-serif; background-color: #fcf8ff; min-height: 100vh; padding-bottom: 80px; }
        h1, h2, h3, .font-headline { font-family: 'Manrope', sans-serif; }
        .purple-underline {
            background-image: linear-gradient(120deg, #7F77DD 0%, #7F77DD 100%);
            background-repeat: no-repeat;
            background-size: 100% 0.2em;
            background-position: 0 88%;
        }
      `}} />

      <div className="dash-container text-on-surface">
        
        {/* Top Header & Language */}
        <div className="max-w-7xl mx-auto px-8 pt-6 pb-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <span className="text-xl font-black text-[#1A1A2E] font-headline">누리캠퍼스</span>
          </div>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as SupportedLanguage)}
            className="px-4 py-2 rounded-xl border border-surface-variant bg-white text-sm font-bold shadow-sm outline-none focus:border-primary-container cursor-pointer transition-colors"
          >
            {(Object.keys(LANGUAGES) as SupportedLanguage[]).map((k) => (
              <option key={k} value={k}>{LANGUAGES[k]}</option>
            ))}
          </select>
        </div>

        <main className="max-w-7xl mx-auto px-8 w-full mt-4">
          
          {/* HERO SECTION / Greeting */}
          <section className="relative overflow-hidden pt-8 pb-16 grid grid-cols-1 md:grid-cols-[55%_45%] gap-12 items-center">
            <div className="z-10">
              <div className="inline-flex items-center gap-2 bg-tertiary-container/10 text-tertiary-container px-4 py-2 rounded-full text-sm font-bold mb-6">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
                맞춤형 AI 학습 리포트 업데이트 완료
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-on-surface leading-[1.2] mb-6">
                {getGreeting()} <br/>
                <span className="purple-underline">{user?.name} 학생님!</span>
              </h1>
              <p className="text-on-surface-variant text-lg leading-relaxed max-w-xl mb-10">
                {t.greeting_desc || '오늘도 AI 선생님과 함께 목표를 향해 달려볼까요?'}
              </p>
              
              <div className="flex flex-wrap gap-4 items-center">
                <button 
                  onClick={() => window.scrollTo({ top: document.getElementById('segments')?.offsetTop, behavior: 'smooth' })}
                  className="bg-primary text-on-primary text-base font-bold px-8 py-4 rounded-2xl shadow-xl shadow-primary/25 hover:-translate-y-1 transition-all flex items-center gap-2"
                >
                  새로운 수업 시작하기
                  <span className="material-symbols-outlined font-bold">arrow_downward</span>
                </button>
              </div>
            </div>

            {/* Hero Visual (UI Mockup) from Stitch */}
            <div className="relative pointer-events-none hidden md:block">
              <div className="bg-white rounded-[2.5rem] shadow-2xl p-6 relative z-10 border border-surface-variant/50">
                <div className="flex items-center gap-4 mb-6 border-b border-surface-container pb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-container flex items-center justify-center text-white overflow-hidden">
                    <img alt="Teacher" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBR29HvLxEmYXYsHzHS3-AzVdONW2_J3jprMLqvjUZuAhj4VM-M-rUpfl5Uy64XXRP-1GhGKUr3ixNki9Qu56F1LT_oD2nwolDkP9_2J5Af4Z0S03hpWP2PbImVQOLbKvM7U0IBfwDDaL5-vKsc9mIbvo_7DL4LCP6DhlwUENY-GZ7exJ6TKhDp5ALE1O3oyzn4a9FRLhkgOoYMFzjf5OiHAPhXIVlLAfiTUpnA_ThS0qZuWkrjrNOq5PNxyZ5-uUu4CpjpxnVKQYc" />
                  </div>
                  <div>
                    <div className="font-bold">당신만의 전담 마스터</div>
                    <div className="text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-tertiary-container"></span> 지금 바로 질문해보세요
                    </div>
                  </div>
                </div>
                <div className="space-y-4 mb-6">
                  <div className="bg-surface-container-low rounded-2xl rounded-tl-none p-4 text-sm max-w-[85%]">
                    안녕하세요 {user?.name}님! 지난번에 학습한 내용을 이어서 진도를 나갈까요? 📚
                  </div>
                  <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 text-sm max-w-[85%] ml-auto">
                    네, 좋아요!
                  </div>
                </div>
              </div>
              <div className="absolute top-10 -right-6 bg-white shadow-xl p-4 rounded-2xl z-20 flex items-center gap-3 animate-bounce">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-500">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                </div>
                <div>
                  <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">Streak</div>
                  <div className="font-bold">연속 학습 중!</div>
                </div>
              </div>
            </div>
          </section>

          {/* Recent Conversations */}
          {conversationList.length > 0 && (
            <section className="mb-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">history</span> 
                  이어서 학습하기
                </h2>
                <Link href="/history" className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors flex items-center">
                  전체보기 <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {conversationList.map((conv) => {
                  const subjectStr = conv.subject as string;
                  const segmentData = conv.segmentId ? getSegment(conv.segmentId) : null;
                  const subjectData = conv.segmentId && conv.subjectId ? getSubject(conv.segmentId, conv.subjectId) : null;
                  const displayTitle = conv.title || (subjectData ? subjectData.name : SUBJECT_LABELS[subjectStr as Subject]);
                  const displayIcon = subjectData?.icon || SUBJECT_EMOJIS[subjectStr as Subject] || '📝';
                  const themeColor = segmentData ? segmentData.accentColor : SUBJECT_COLORS[subjectStr as Subject] || '#7F77DD';

                  return (
                    <button
                      key={conv.id}
                      onClick={() => router.push(`/chat/${conv.id}`)}
                      className="bg-white p-6 rounded-2xl hover:shadow-xl transition-all border border-transparent hover:border-primary/10 group text-left flex flex-col h-full shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm" style={{ backgroundColor: themeColor + '15', color: themeColor }}>
                          {displayIcon}
                        </div>
                        <div>
                          <div className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{displayTitle}</div>
                          <div className="text-xs text-on-surface-variant mt-1">
                            {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true, locale: ko })}
                          </div>
                        </div>
                      </div>
                      <div className="bg-surface-container-low rounded-xl p-3 mt-auto flex items-center justify-between">
                        <span className="text-xs font-semibold text-primary">대화 이어하기</span>
                        <span className="material-symbols-outlined text-primary text-[18px]">arrow_forward</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Recommendations (Trust bar styled) */}
          {recommendations.length > 0 && (
            <section className="bg-primary/5 rounded-[2rem] p-8 md:p-12 mb-16 border border-primary/10">
              <h2 className="text-2xl font-black mb-8 flex items-center gap-3 text-primary">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span> 
                {t.today_recommend}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendations.map((rec, i) => (
                  <button
                    key={i}
                    onClick={() => startChat(rec.subject)}
                    className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all text-left flex items-start gap-4 border border-surface-container"
                  >
                    <div className="text-4xl">{SUBJECT_EMOJIS[rec.subject]}</div>
                    <div>
                      <div className="font-bold text-lg mb-1">{SUBJECT_LABELS[rec.subject]}</div>
                      <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-2">{rec.message}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* SEGMENT CARDS from Stitch */}
          <section id="segments" className="mb-16 pt-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black mb-3">나에게 맞는 과정이 있어요</h2>
              <p className="text-on-surface-variant">목표가 무엇이든 누리캠퍼스가 함께합니다</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.values(SEGMENTS).map((seg) => (
                <button
                  key={seg.id}
                  onClick={() => router.push(`/${seg.id}`)}
                  className="bg-white p-8 rounded-3xl hover:shadow-2xl transition-all border border-surface-variant/50 hover:border-primary/20 group text-left relative overflow-hidden flex flex-col shadow-sm"
                  style={{ minHeight: '260px' }}
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform" style={{ backgroundColor: seg.bgColor, color: seg.accentColor }}>
                    <span className="material-symbols-outlined text-3xl">{['school', 'menu_book', 'work', 'verified', 'elderly', 'language'][Math.random()*6 | 0] || 'school'}</span>
                  </div>
                  <h3 className="text-2xl font-black mb-3 text-on-surface">{seg.name}</h3>
                  <p className="text-on-surface-variant text-sm mb-6 flex-1">
                    {seg.id === 'k12' ? '내신 대비부터 수능까지, 맞춤 케어' : 
                     seg.id === 'university' ? '전공 심화 학습과 과제 도우미' :
                     seg.id === 'worker' ? '커리어 점프업을 위한 실무 스킬' :
                     seg.id === 'cert' ? '합격을 위한 단기 집중 트레이닝' :
                     seg.id === 'silver' ? '시니어 맞춤 교양 학습과 훈련' : '자연스럽게 배우는 글로벌 코스'}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {seg.subjects.slice(0, 3).map((sub, idx) => (
                      <span key={idx} className="px-3 py-1 bg-surface-container rounded-full text-[11px] font-bold" style={{ color: seg.accentColor, backgroundColor: seg.bgColor }}>
                        {sub.name}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </section>

        </main>
      </div>
    </AppLayout>
  );
}
