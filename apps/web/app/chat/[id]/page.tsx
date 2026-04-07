'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore, useLanguageStore } from '../../../lib/store';
import api from '../../../lib/api';
import { Message, SUBJECT_LABELS, SUBJECT_EMOJIS, SUBJECT_COLORS } from '../../../lib/types';
import { getCourse, getSegment } from '../../../config/segments';
import styles from './chat.module.css';
import AppLayout from '../../../components/AppLayout';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useGeminiLive } from '../../../lib/useGeminiLive';
import { SupportedLanguage, LANGUAGES, TRANSLATIONS, PROMPT_MAP, VOICE_MAP } from '../../../lib/i18n';
import { MathInput } from '../../../components/tutor/MathInput';
import { MathDrawPad } from '../../../components/tutor/MathDrawPad';
import { OcrPreviewBubble } from '../../../components/tutor/OcrPreviewBubble';
import { MathRenderer } from '../../../components/tutor/MathRenderer';
import { MathOcrResult } from '../../../types/math';

const QUICK_ACTIONS = (t: Record<string, string>) => [
  { label: t.concept_mode, emoji: '📘', prompt: '개념 설명을 요청합니다. 쉬운 말로, 비유를 사용해서, 한 번에 하나씩 설명해줘.' },
  { label: t.step_mode, emoji: '📐', prompt: '문제 풀이를 요청합니다. 정답을 바로 주지 말고 단계별로, 내가 따라올 수 있게 천천히 진행하며, 중간중간 확인 질문을 던져줘.' },
  { label: t.summary_mode, emoji: '📌', prompt: '지금까지 배운 내용을 간단하게 요약해줘.' },
];

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const user = useAuthStore((s) => s.user);

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [replyMode, setReplyMode] = useState<'TEXT' | 'VOICE'>('TEXT');
  const [xpNotice, setXpNotice] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recNotice, setRecNotice] = useState<any>(null);
  const [upgradeNotice, setUpgradeNotice] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showText, setShowText] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const { lang, setLang } = useLanguageStore();

  const t = TRANSLATIONS[lang];

  const [ocrState, setOcrState] = useState<{
    status: 'idle' | 'processing' | 'preview'
    previewUrl: string
    result: MathOcrResult | null
  }>({ status: 'idle', previewUrl: '', result: null })
  const [showDrawPad, setShowDrawPad] = useState(false)

  const handleOcrStart = (previewUrl: string) => {
    setOcrState({ status: 'processing', previewUrl, result: null })
  }

  const handleOcrComplete = (result: MathOcrResult) => {
    setOcrState({ status: 'preview', previewUrl: result.imagePreviewUrl, result })
  }

  const handleOcrError = (error: string) => {
    setOcrState({ status: 'idle', previewUrl: '', result: null })
    // toast error?
  }

  const handleDrawSubmit = async (imageDataUrl: string) => {
    setShowDrawPad(false)
    const base64 = imageDataUrl.split(',')[1]
    const previewUrl = imageDataUrl

    handleOcrStart(previewUrl)

    const response = await fetch('/api/math-ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64, mimeType: 'image/png' }),
    })

    const data = await response.json()
    if (data.latex) {
      handleOcrComplete({
        latex: data.latex,
        confidence: data.confidence,
        imagePreviewUrl: previewUrl,
      })
    } else {
      handleOcrError('수식을 인식하지 못했습니다.')
    }
  }

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    fetchMessages();
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const [msgRes, convRes] = await Promise.all([
        api.get(`/conversations/${id}/messages`),
        api.get('/conversations'),
      ]);
      setMessages(msgRes.data);
      const conv = convRes.data.find((c: any) => c.id === id);
      setConversation(conv);
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const subject = conversation?.subject;
  const isSegment = !!conversation?.segmentId;
  const course = isSegment ? getCourse(conversation.segmentId, conversation.subjectId, conversation.courseId) : null;
  const segmentTheme = isSegment ? getSegment(conversation.segmentId) : null;
  
  const uiThemeColor = isSegment ? segmentTheme?.accentColor || '#7F77DD' : (subject ? SUBJECT_COLORS[subject as keyof typeof SUBJECT_COLORS] : '#a5b4fc');

  const SYSTEM_PROMPT = isSegment && course ? `
${course.systemPrompt}

[CRITICAL LANGUAGE INSTRUCTION]
You MUST respond EXCLUSIVELY in ${LANGUAGES[lang]}. 
Ignore any implied language from the prompt translation if it differs, and ONLY generate output in ${LANGUAGES[lang]}.

[MATH & LATEX FORMATTING]
- ALL mathematical equations, expressions, and formulas MUST be written in LaTeX notation.
- Use $ for inline math (e.g. $x = 2$) and $$ for block math (e.g. $$x = \\frac{1}{2}$$).
- NEVER use backticks (\`) or AsciiMath for formulas under any circumstances.
` : `
${PROMPT_MAP[lang]}

[CRITICAL LANGUAGE INSTRUCTION]
You MUST respond EXCLUSIVELY in ${LANGUAGES[lang]}. 
Ignore any implied language from the prompt translation if it differs, and ONLY generate output in ${LANGUAGES[lang]}.
Ensure all your responses are formatted for TTS (Text-To-Speech) and spoken naturally in ${LANGUAGES[lang]}.

[Core Role]
- Act as a friendly AI tutor for students.
- Always explain concepts to help students understand easily.
- Maintain a warm tone so students feel comfortable asking questions.

[Input/Output]
- Base input is text but may originate from voice.
- All basic responses must be generated for "Voice Output".
- Write sentences as if speaking naturally, not like a textbook.

[Tone Rules]
- No stiff sentences. Focus on natural spoken conversational language.
- Always start softly and encouragingly.

[Response Structure]
1. Short empathy/encouragement
2. Core explanation
3. Easy example or step-by-step
4. Quick summary
5. Prompt next action

[Additional Rules]
- Keep sentences short (under 25 words).
- Explain math/formulas in words, but ALWAYS wrap mathematical expressions in LaTeX delimiters ($ or $$).

[MATH & LATEX FORMATTING]
- ALL mathematical equations, expressions, and formulas MUST be written in LaTeX notation.
- Use $ for inline math (e.g. $x = 2$) and $$ for block math (e.g. $$x = \\frac{1}{2}$$).
- NEVER use backticks (\`) or AsciiMath for formulas under any circumstances.
`;

  const { isConnected, isConnecting, isSpeaking, error: voiceError, toggleConnect, connect, disconnect, sendText, pauseAudio, resumeAudio } = useGeminiLive({
    systemInstruction: SYSTEM_PROMPT,
    audioEnabled,
    voiceName: VOICE_MAP[lang].voiceName,
    onMessage: (text) => {
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'ASSISTANT' && lastMsg.id.startsWith('voice-')) {
          const updated = [...prev];
          updated[updated.length - 1] = { ...lastMsg, content: lastMsg.content + text };
          return updated;
        } else {
          return [...prev, {
            id: 'voice-' + Date.now().toString() + Math.random().toString(),
            conversationId: id,
            role: 'ASSISTANT',
            content: text,
            questionType: 'casual',
            createdAt: new Date().toISOString(),
          }];
        }
      });
    },
    onUserSpeak: (text) => {
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'USER' && lastMsg.id.startsWith('voice-')) {
          const updated = [...prev];
          updated[updated.length - 1] = { ...lastMsg, content: lastMsg.content + text };
          return updated;
        } else {
          return [...prev, {
            id: 'voice-req-' + Date.now().toString() + Math.random().toString(),
            conversationId: id,
            role: 'USER',
            content: text,
            questionType: 'casual',
            createdAt: new Date().toISOString(),
          }];
        }
      });
    }
  });

  // Automatically disconnect when switching back to text mode
  useEffect(() => {
    if (replyMode === 'TEXT') {
      disconnect();
    }
  }, [replyMode, disconnect]);

  const handleOcrConfirm = (latex: string, userText: string) => {
    const messageText = userText
      ? `[수식 질문]\n$$${latex}$$\n\n${userText}`
      : `[수식 질문]\n$$${latex}$$\n\n이 수식을 설명해주세요.`;
    
    sendMessage(messageText);
    setOcrState({ status: 'idle', previewUrl: '', result: null });
  };

  const sendMessage = async (content?: string) => {
    let text = content || input.trim();
    if ((!text && !attachment) || sending) return;
    if (!text && attachment) text = '(첨부 파일 전송됨)'; // 빈 텍스트일 경우 백엔드 유효성 검사 우회 및 AI 인식 도움

    setInput('');
    setSending(true);

    // Optimistic update
    const tempMsg: Message = {
      id: 'temp-' + Date.now() + Math.random().toString(),
      conversationId: id,
      role: 'USER',
      content: text,
      attachmentUrl: attachment || undefined,
      questionType: 'casual',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    const sentAttachment = attachment;
    setAttachment(null);
    if(fileInputRef.current) fileInputRef.current.value = '';

    try {
      const res = await api.post(`/conversations/${id}/messages`, { content: text, mode: replyMode, lang: lang, attachmentUrl: sentAttachment });
      
      const newAiMessage = res.data.aiMessage;
      if (res.data.audioBase64) {
        const audioDataUrl = `data:audio/wav;base64,${res.data.audioBase64}`;
        newAiMessage.audioBase64 = res.data.audioBase64;
        try {
          const audio = new Audio(audioDataUrl);
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              // Autoplay blocked on mobile — user can tap play button in message
            });
          }
        } catch (e) {
          console.error('Audio playback error', e);
        }
      }

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempMsg.id),
        res.data.userMessage,
        newAiMessage,
      ]);

      if (res.data.leveledUp) {
        setXpNotice('🎊 레벨 업 달성! 🎊\n경험치를 모두 채웠습니다!');
      } else {
        setXpNotice('+10 XP 획득!');
      }
      setTimeout(() => setXpNotice(null), 3000);

      if (res.data.recommendation) {
        setRecNotice(res.data.recommendation);
        setTimeout(() => setRecNotice(null), 6000);
      }
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      // 402: 일일 한도 초과
      if (err?.response?.status === 402) {
        const msg = err.response.data?.message || '오늘 AI 응답 한도를 초과했습니다.';
        setUpgradeNotice(msg);
        setTimeout(() => setUpgradeNotice(null), 8000);
      } else {
        setInput(text);
      }
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          <p>{t.loading_chat || '대화를 불러오는 중...'}</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className={styles.chatLayout}>
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => router.push('/dashboard')}>
            {t.back}
          </button>
          {subject && (
            <div className={styles.subjectTag} style={{ color: uiThemeColor, borderColor: uiThemeColor + '40' }}>
              <div className={styles.headerDot} style={{ backgroundColor: uiThemeColor, boxShadow: `0 0 10px ${uiThemeColor}` }} />
              <span>{SUBJECT_EMOJIS[subject as keyof typeof SUBJECT_EMOJIS] || '📝'}</span>
              <span>{SUBJECT_LABELS[subject as keyof typeof SUBJECT_LABELS] || subject}</span>
            </div>
          )}
          {conversation?.segmentId === 'cert' && (
            <div className={styles.ddayTag} style={{ backgroundColor: uiThemeColor, color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold' }}>
              D-30
            </div>
          )}
          <div className={styles.headerTitle}>{conversation?.title || t.ai_tutor}</div>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as SupportedLanguage)}
            style={{ padding: '4px 8px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', background: 'white', flexShrink: 0 }}
          >
            {(Object.keys(LANGUAGES) as SupportedLanguage[]).map((k) => (
              <option key={k} value={k}>{LANGUAGES[k]}</option>
            ))}
          </select>
        </div>

        {/* Messages */}
        <div className={styles.messages}>
          
          {recNotice && (
            <div className={styles.recBanner}>
              <div className={styles.recIcon}>💡</div>
              <div className={styles.recText}>
                <strong>{t.ai_analysis}</strong>
                <p>{recNotice.message}</p>
              </div>
              <button className={styles.recActionBtn}>{t.review_concept}</button>
            </div>
          )}

          {xpNotice && (
            <div className={styles.xpToast}>
              {xpNotice}
            </div>
          )}

          {upgradeNotice && (
            <div style={{
              margin: '8px 16px',
              padding: '14px 18px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #1c1a3a, #12152e)',
              border: '1px solid rgba(255,107,53,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#FF6B35', marginBottom: 3 }}>🔒 오늘 AI 응답 한도 초과</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{upgradeNotice}</p>
              </div>
              <button
                onClick={() => window.location.href = '/pricing'}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 800, background: 'linear-gradient(135deg, #FFD24C, #FF6B35)', color: '#0B0E2A', whiteSpace: 'nowrap' }}
              >
                업그레이드 →
              </button>
            </div>
          )}

          {messages.length === 0 && (
            <div className={styles.welcome}>
              <div className={styles.welcomeAvatar}>🎓</div>
              <h3>{t.chat_welcome}</h3>
              <div style={{ color: '#555', marginTop: '8px' }}>
                {course ? (
                  <>
                    <span>선생님 <b>{segmentTheme?.teacherPersona.tone}</b> 말투로 꼼꼼하게 알려드릴게요.</span>
                    <br/><br/>
                    <strong style={{ color: uiThemeColor }}>추천 질문:</strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                      {course.starterQuestions.map((sq: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => {
                            setInput(sq);
                            // Optional: auto-send
                            // setTimeout(() => sendMessage(), 100);
                          }}
                          style={{
                            textAlign: 'left',
                            padding: '10px 16px',
                            backgroundColor: '#f8fafc',
                            border: `1px solid ${uiThemeColor}40`,
                            borderRadius: '8px',
                            fontSize: '14px',
                            color: '#334155',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = `${uiThemeColor}15`; }}
                          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                        >
                          {sq}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  subject
                    ? `${SUBJECT_LABELS[subject as keyof typeof SUBJECT_LABELS]}${t.chat_welcome_desc1}`
                    : t.chat_welcome_desc2
                )}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={msg.id}
              className={`${styles.message} ${msg.role === 'USER' ? styles.userMessage : styles.aiMessage}`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              {msg.role === 'ASSISTANT' && (
                <div className={styles.aiAvatar}>🎓</div>
              )}
              <div className={styles.bubble}>
                <div className={styles.bubbleContent} style={{ filter: showText ? 'none' : 'blur(6px)', opacity: showText ? 1 : 0.6, transition: 'all 0.3s ease', whiteSpace: 'pre-wrap' }}>
                  {msg.role === 'USER' && msg.attachmentUrl && (
                  <div style={{ marginBottom: '8px' }}>
                    <img src={msg.attachmentUrl} alt="attachment" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
                  </div>
                )}
                <MathRenderer text={msg.content} className="text-sm leading-relaxed" />
                </div>
                <div className={styles.bubbleTime}>
                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: ko })}
                  {msg.audioBase64 && (
                    <button 
                      className={styles.playBtn}
                      onClick={() => new Audio(`data:audio/wav;base64,${msg.audioBase64}`).play()}
                      title="다시 듣기"
                    >
                      🔊
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {sending && (
            <div className={`${styles.message} ${styles.aiMessage}`}>
              <div className={styles.aiAvatar}>🎓</div>
              <div className={styles.bubble}>
                <div className={styles.typing}>
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          {QUICK_ACTIONS(t).map((action, i) => (
            <button
              key={i}
              className={styles.quickBtn}
              onClick={() => {
                if (replyMode === 'VOICE' && isConnected) {
                  sendText(action.prompt);
                } else {
                  sendMessage(action.prompt);
                }
              }}
              disabled={sending}
            >
              <span>{action.emoji}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>

        {/* Input */}
        <div className={styles.inputArea}>
          <div className={styles.inputHeader} style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div className={styles.modeToggle}>
              <button 
                className={`${styles.modeBtn} ${replyMode === 'TEXT' ? styles.activeMode : ''}`}
                onClick={() => setReplyMode('TEXT')}
              >
                {t.text_mode}
              </button>
              <button 
                className={`${styles.modeBtn} ${replyMode === 'VOICE' ? styles.activeMode : ''}`}
                onClick={() => setReplyMode('VOICE')}
              >
                {t.voice_mode}
              </button>
            </div>
            {replyMode === 'VOICE' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  style={{ background: 'none', border: '1px solid #ccc', borderRadius: '8px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
                >
                  {audioEnabled ? t.sound_on : t.sound_off}
                </button>
                <button 
                  onClick={() => {
                    if (isPaused) resumeAudio();
                    else pauseAudio();
                    setIsPaused(!isPaused);
                  }}
                  style={{ background: 'none', border: '1px solid #ccc', borderRadius: '8px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
                >
                  {isPaused ? t.play : t.stop}
                </button>
                <button 
                  onClick={() => setShowText(!showText)}
                  style={{ background: 'none', border: '1px solid #ccc', borderRadius: '8px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
                >
                  {showText ? t.hide_text : t.show_text}
                </button>
              </div>
            )}
          </div>
          <div className={styles.inputControls}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {replyMode === 'VOICE' && (
                <button
                  className={`${styles.input} ${isConnected ? styles.voiceActive : ''}`}
                  onClick={toggleConnect}
                  style={{
                    background: isConnected ? '#fee2e2' : '#f3f4f6',
                    color: isConnected ? '#ef4444' : '#374151',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    border: isConnected ? '2px solid #ef4444' : '2px solid transparent',
                    transition: 'all 0.3s ease',
                    padding: '8px 16px',
                    borderRadius: '12px'
                  }}
                >
                  {isConnected ? (
                    <>
                      <span className={styles.pulseDot} style={{ background: '#ef4444' }}></span>
                      {isSpeaking ? 'AI Tutor Speaking...' : t.mic_on}
                    </>
                  ) : isConnecting ? (
                    <>연결 중...⏳</>
                  ) : (
                    <>{t.mic_connect}</>
                  )}
                </button>
              )}

              {replyMode === 'VOICE' && voiceError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#dc2626', display: 'flex', gap: '8px' }}>
                  <span>⚠️</span><span>{voiceError}</span>
                </div>
              )}
              
              {ocrState.status !== 'idle' && (
                <div style={{ paddingBottom: '8px' }}>
                  <OcrPreviewBubble
                    imagePreviewUrl={ocrState.previewUrl}
                    latex={ocrState.result?.latex ?? ''}
                    isProcessing={ocrState.status === 'processing'}
                    onConfirm={handleOcrConfirm}
                    onRetry={() => setOcrState({ status: 'idle', previewUrl: '', result: null })}
                    onCancel={() => setOcrState({ status: 'idle', previewUrl: '', result: null })}
                  />
                </div>
              )}

              {showDrawPad && (
                <MathDrawPad
                  onSubmit={handleDrawSubmit}
                  onClose={() => setShowDrawPad(false)}
                />
              )}

              {attachment && (
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '8px', alignSelf: 'flex-start' }}>
                  <img src={attachment} alt="Upload Preview" style={{ height: '60px', borderRadius: '8px', border: '1px solid #ccc' }} />
                  <button
                    onClick={() => { setAttachment(null); setOcrState({ status: 'idle', previewUrl: '', result: null }); }}
                    style={{ position: 'absolute', top: -8, right: -8, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ×
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', width: '100%' }}>
                <MathInput
                  onOcrStart={handleOcrStart}
                  onOcrComplete={handleOcrComplete}
                  onOcrError={handleOcrError}
                  onImageReady={(dataUrl) => setAttachment(dataUrl)}
                  onDrawPadOpen={() => setShowDrawPad(true)}
                  disabled={sending}
                />
                <textarea
                  ref={inputRef}
                  className={styles.input}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (isConnected && (input.trim() || attachment)) {
                        // Optimistic UI for WebSocket
                        setMessages((prev) => [
                          ...prev,
                          {
                            id: 'voice-req-' + Date.now() + Math.random(),
                            conversationId: id,
                            role: 'USER',
                            content: input.trim() || '(첨부 파일 전송됨)',
                            attachmentUrl: attachment,
                            questionType: 'casual',
                            createdAt: new Date().toISOString(),
                          } as any
                        ]);
                        sendText(input.trim() || '(첨부 파일 전송됨)'); // Send to websocket
                        setInput('');
                        setAttachment(null);
                        if(fileInputRef.current) fileInputRef.current.value = '';
                      } else {
                        sendMessage(); // Send to backend REST API
                      }
                    }
                  }}
                  placeholder={t.placeholder}
                  rows={1}
                  style={{ resize: 'none' }}
                  disabled={sending}
                />
                <button
                  className={styles.sendBtn}
                  onClick={() => {
                    if (isConnected && (input.trim() || attachment)) {
                       setMessages((prev) => [
                          ...prev,
                           {
                             id: 'voice-req-' + Date.now() + Math.random(),
                             conversationId: id,
                             role: 'USER',
                             content: input.trim() || '(첨부 파일 전송됨)',
                             attachmentUrl: attachment,
                             questionType: 'casual',
                             createdAt: new Date().toISOString(),
                           } as any
                       ]);
                       sendText(input.trim() || '(첨부 파일 전송됨)');
                       setInput('');
                       setAttachment(null);
                       if(fileInputRef.current) fileInputRef.current.value = '';
                    } else {
                       sendMessage();
                    }
                  }}
                  disabled={!(input.trim() || attachment) || sending}
                  style={subject ? { background: `linear-gradient(135deg, ${uiThemeColor}88, ${uiThemeColor})` } : {}}
                >
                  {sending ? '⏳' : '→'}
                </button>
              </div>
            </div>
            {voiceError && (
              <div style={{ position: 'absolute', top: -30, color: 'red', fontSize: '12px' }}>
                오류: {voiceError}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
