'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '../../../lib/store';
import api from '../../../lib/api';
import { Message, SUBJECT_LABELS, SUBJECT_EMOJIS, SUBJECT_COLORS } from '../../../lib/types';
import styles from './chat.module.css';
import AppLayout from '../../../components/AppLayout';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

const QUICK_ACTIONS = [
  { label: '더 쉽게 설명해줘', emoji: '🔍' },
  { label: '예시 들어줘', emoji: '💡' },
  { label: '문제처럼 내줘', emoji: '📝' },
  { label: '요약해줘', emoji: '📌' },
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
  const [recNotice, setRecNotice] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  const sendMessage = async (content?: string) => {
    const text = content || input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);

    // Optimistic update
    const tempMsg: Message = {
      id: 'temp-' + Date.now(),
      conversationId: id,
      role: 'USER',
      content: text,
      questionType: 'casual',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await api.post(`/conversations/${id}/messages`, { content: text, mode: replyMode });
      
      const newAiMessage = res.data.aiMessage;
      if (res.data.audioBase64) {
        newAiMessage.audioBase64 = res.data.audioBase64;
        
        try {
          const audio = new Audio(`data:audio/mp3;base64,${res.data.audioBase64}`);
          audio.play().catch(err => console.error("Auto-play blocked", err));
        } catch (e) {
          console.error("Audio playback error", e);
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
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      setInput(text);
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
          <p>대화를 불러오는 중...</p>
        </div>
      </AppLayout>
    );
  }

  const subject = conversation?.subject;
  const subjectColor = subject ? SUBJECT_COLORS[subject as keyof typeof SUBJECT_COLORS] : '#a5b4fc';

  return (
    <AppLayout>
      <div className={styles.chatLayout}>
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => router.push('/dashboard')}>
            ← 뒤로
          </button>
          {subject && (
            <div className={styles.subjectTag} style={{ color: subjectColor, borderColor: subjectColor + '40' }}>
              <span>{SUBJECT_EMOJIS[subject as keyof typeof SUBJECT_EMOJIS]}</span>
              <span>{SUBJECT_LABELS[subject as keyof typeof SUBJECT_LABELS]}</span>
            </div>
          )}
          <div className={styles.headerTitle}>{conversation?.title || 'AI 튜터'}</div>
        </div>

        {/* Messages */}
        <div className={styles.messages}>
          
          {recNotice && (
            <div className={styles.recBanner}>
              <div className={styles.recIcon}>💡</div>
              <div className={styles.recText}>
                <strong>AI 튜터 분석</strong>
                <p>{recNotice.message}</p>
              </div>
              <button className={styles.recActionBtn}>개념 복습하기</button>
            </div>
          )}

          {xpNotice && (
            <div className={styles.xpToast}>
              {xpNotice}
            </div>
          )}

          {messages.length === 0 && (
            <div className={styles.welcome}>
              <div className={styles.welcomeAvatar}>🎓</div>
              <h3>안녕! AI 튜터야 😊</h3>
              <p>
                {subject
                  ? `${SUBJECT_LABELS[subject as keyof typeof SUBJECT_LABELS]} 공부 도와줄게! 궁금한 거 뭐든 물어봐`
                  : '무엇이든 질문해봐! 친절하게 설명해줄게'}
              </p>
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
                <div className={styles.bubbleContent}>
                  {msg.content.split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < msg.content.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
                <div className={styles.bubbleTime}>
                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: ko })}
                  {msg.audioBase64 && (
                    <button 
                      className={styles.playBtn}
                      onClick={() => new Audio(`data:audio/mp3;base64,${msg.audioBase64}`).play()}
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
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              className={styles.quickBtn}
              onClick={() => sendMessage(action.label)}
              disabled={sending}
            >
              <span>{action.emoji}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>

        {/* Input */}
        <div className={styles.inputArea}>
          <div className={styles.inputHeader}>
            <div className={styles.modeToggle}>
              <button 
                className={`${styles.modeBtn} ${replyMode === 'TEXT' ? styles.activeMode : ''}`}
                onClick={() => setReplyMode('TEXT')}
              >
                📝 문자
              </button>
              <button 
                className={`${styles.modeBtn} ${replyMode === 'VOICE' ? styles.activeMode : ''}`}
                onClick={() => setReplyMode('VOICE')}
              >
                🎙️ 음성 (Live)
              </button>
            </div>
          </div>
          <div className={styles.inputControls}>
            <textarea
              ref={inputRef}
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="궁금한 거 뭐든 물어봐! (Enter로 전송)"
              rows={1}
              style={{ resize: 'none' }}
              disabled={sending}
            />
            <button
              className={styles.sendBtn}
              onClick={() => sendMessage()}
              disabled={!input.trim() || sending}
              style={subject ? { background: `linear-gradient(135deg, ${subjectColor}88, ${subjectColor})` } : {}}
            >
              {sending ? '⏳' : '→'}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
