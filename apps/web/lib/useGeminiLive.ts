"use client";

import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';

function base64ToArrayBuffer(base64: string) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export function useGeminiLive({
  systemInstruction,
  onMessage,
  onUserSpeak,
  audioEnabled = true,
  voiceName = 'Aoede',
}: {
  systemInstruction?: string;
  onMessage?: (text: string) => void;
  onUserSpeak?: (text: string) => void;
  audioEnabled?: boolean;
  voiceName?: string;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const audioEnabledRef = useRef(audioEnabled);
  audioEnabledRef.current = audioEnabled;

  const playAudioChunk = (base64Audio: string) => {
    if (!audioEnabledRef.current) return;
    const audioCtx = audioContextRef.current;
    if (!audioCtx) return;

    try {
      const buffer = base64ToArrayBuffer(base64Audio);
      const dataView = new DataView(buffer);
      // Gemini returns 24kHz PCM 16-bit mono Audio
      const float32Array = new Float32Array(buffer.byteLength / 2);
      for (let i = 0; i < buffer.byteLength / 2; i++) {
        const int16 = dataView.getInt16(i * 2, true); // Little endian
        float32Array[i] = int16 / 32768;
      }

      const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);

      // Schedule play sequentially without gap
      const scheduleTime = Math.max(audioCtx.currentTime, nextPlayTimeRef.current);
      source.start(scheduleTime);
      nextPlayTimeRef.current = scheduleTime + audioBuffer.duration;
    } catch (err) {
      console.error('Error playing audio chunk:', err);
    }
  };

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {}
      sessionRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    setIsConnected(false);
    setIsSpeaking(false);
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is missing in your .env.local file.');
      }

      const ai = new GoogleGenAI({ apiKey });
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      audioContextRef.current = audioCtx;
      nextPlayTimeRef.current = audioCtx.currentTime;

      let mediaStream: MediaStream | null = null;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        mediaStreamRef.current = mediaStream;
      } catch (micErr: any) {
        console.warn('Microphone not available, running in text-input-only voice mode', micErr);
        // Do not throw, allow text-to-voice fallback
      }

      const session = await ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        config: {
          responseModalities: ['audio'] as any,
          systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            // Send initial connection text to say hello to Gemini!
            try {
               session.sendRealtimeInput({ text: '안녕하세요, 준비됐어? 내가 말할 때까지 기다렸다가 대답해줘!' });
            } catch(e) {}
          },
          onmessage: (response) => {
            const content = response.serverContent;
            
            // Reinitialize nextPlayTime if we lagged behind so audio doesn't delay
            if (audioContextRef.current && nextPlayTimeRef.current < audioContextRef.current.currentTime) {
              nextPlayTimeRef.current = audioContextRef.current.currentTime;
            }

            if (content?.modelTurn?.parts) {
              setIsSpeaking(true);
              let fullText = '';
              for (const part of content.modelTurn.parts) {
                if (part.text) {
                  fullText += part.text;
                }
                if (part.inlineData && part.inlineData.mimeType?.startsWith('audio/pcm') && part.inlineData.data) {
                  playAudioChunk(part.inlineData.data);
                }
              }
              if (fullText && onMessage) onMessage(fullText);
            }

            if (content?.interrupted) {
              setIsSpeaking(false);
              if (audioContextRef.current) {
                nextPlayTimeRef.current = audioContextRef.current.currentTime;
              }
            }

            if (content?.turnComplete) {
              setIsSpeaking(false);
            }

            if (content?.inputTranscription?.text) {
              if (onUserSpeak) onUserSpeak(content.inputTranscription.text);
            }
            if (content?.outputTranscription?.text) {
              if (onMessage) onMessage(content.outputTranscription.text);
            }
          },
          onerror: (err: any) => {
            console.error('Gemini Live API Error:', err);
            setError(err.message || 'Gemini connection error');
            disconnect();
          },
          onclose: () => {
            console.log('Gemini Live WebSocket Closed');
            disconnect();
          },
        },
      });

      sessionRef.current = session;

      // Start processing mic input to send iteratively ONLY if we have a mic
      if (mediaStream) {
        const source = audioCtx.createMediaStreamSource(mediaStream);
        sourceNodeRef.current = source;
        
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (!sessionRef.current) return;
          
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const val = inputData[i] || 0;
            pcm16[i] = Math.max(-1, Math.min(1, val)) * 32767;
          }

          let binary = '';
          const bytes = new Uint8Array(pcm16.buffer);
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i] || 0);
          }
          const b64 = window.btoa(binary);

          try {
            sessionRef.current.sendRealtimeInput({
              audio: { data: b64, mimeType: 'audio/pcm;rate=16000' },
            });
          } catch (err) {}
        };

        source.connect(processor);
        processor.connect(audioCtx.destination);
      }
    } catch (err: any) {
      console.error('Failed to initialize Audio/Gemini Live:', err);
      if (err.name === 'NotFoundError' || err.message?.includes('Requested device not found')) {
        setError("마이크를 찾을 수 없습니다. PC나 휴대폰에 마이크가 정상적으로 연결되어 있는지 확인해 주세요.");
      } else if (err.name === 'NotAllowedError') {
        setError("마이크 권한이 거부되었습니다. 주소창 자물쇠 아이콘을 눌러 마이크 권한을 허용해 주세요.");
      } else {
        setError(err.message || String(err));
      }
      disconnect();
    }
  }, [systemInstruction, onMessage, disconnect]);

  const toggleConnect = useCallback(() => {
    if (isConnected) disconnect();
    else connect();
  }, [isConnected, connect, disconnect]);

  const sendText = useCallback((text: string) => {
    if (sessionRef.current) {
      sessionRef.current.sendRealtimeInput({ text });
    }
  }, []);

  const pauseAudio = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state === 'running') {
      audioContextRef.current.suspend();
    }
  }, []);

  const resumeAudio = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  return { isConnected, isSpeaking, error, toggleConnect, sendText, connect, disconnect, pauseAudio, resumeAudio };
}
