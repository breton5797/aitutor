import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { Subject, QuestionType, ExplainStyle } from '@prisma/client';
import { getCourse, getSegment } from '../config/segments';

/** PCM16LE (24kHz, mono) → WAV base64 */
function pcmBase64ToWavBase64(pcmBase64: string): string {
  const pcmBuf = Buffer.from(pcmBase64, 'base64');
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuf.length;
  const wavBuf = Buffer.alloc(44 + dataSize);
  wavBuf.write('RIFF', 0);
  wavBuf.writeUInt32LE(36 + dataSize, 4);
  wavBuf.write('WAVE', 8);
  wavBuf.write('fmt ', 12);
  wavBuf.writeUInt32LE(16, 16);
  wavBuf.writeUInt16LE(1, 20);          // PCM
  wavBuf.writeUInt16LE(numChannels, 22);
  wavBuf.writeUInt32LE(sampleRate, 24);
  wavBuf.writeUInt32LE(byteRate, 28);
  wavBuf.writeUInt16LE(blockAlign, 32);
  wavBuf.writeUInt16LE(bitsPerSample, 34);
  wavBuf.write('data', 36);
  wavBuf.writeUInt32LE(dataSize, 40);
  pcmBuf.copy(wavBuf, 44);
  return wavBuf.toString('base64');
}

@Injectable()
export class AiService {
  private openai: OpenAI;
  private gemini: GoogleGenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-not-configured',
      dangerouslyAllowBrowser: false,
    });
    this.gemini = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || 'dummy_key',
    });
  }

  private getSubjectName(subject: Subject): string {
    const map: Record<Subject, string> = {
      ENGLISH: '영어',
      MATH: '수학',
      SCIENCE: '과학',
      HISTORY: '역사',
    };
    return map[subject];
  }

  private getSubjectInstruction(subject: Subject): string {
    const instructions: Record<Subject, string> = {
      ENGLISH: '문법, 단어 의미, 독해, 문장 해석을 도와줘. 영어 예문은 한국어 설명과 함께 제시해.',
      MATH: '수학 문제 풀이를 단계별로 설명해. 공식과 풀이 과정을 명확하게 보여줘.',
      SCIENCE: '과학 개념과 원리를 쉽게 설명해. 실생활 예시를 들어 이해를 도와줘.',
      HISTORY: '역사적 사건의 배경과 흐름을 설명해. 시대 순서와 인과관계를 강조해.',
    };
    return instructions[subject] || '';
  }

  private buildSystemPrompt(
    subject: Subject,
    explainStyle?: ExplainStyle,
    studentName?: string,
    langCode: string = 'ko',
    segmentId?: string,
    subjectIdStr?: string,
    courseId?: string,
  ): string {
    // If it's a new segment-based prompt, return from config directly
    if (segmentId && subjectIdStr && courseId) {
      const course = getCourse(segmentId, subjectIdStr, courseId);
      if (course) {
        return course.systemPrompt + `\n\n[CRITICAL LANGUAGE INSTRUCTION]
The user's language setting is '${langCode}'.
If the language is NOT Korean, you MUST entirely translate your response to the user's language.
If you are teaching a specific language (like English, Japanese), keep the examples in that language but explain in '${langCode}'.

[MATH & LATEX FORMATTING]
- ALL mathematical equations, expressions, and formulas MUST be written in LaTeX notation.
- Use $ for inline math (e.g. $x = 2$) and $$ for block math (e.g. $$x = \\frac{1}{2}$$).
- NEVER use backticks (\`) or AsciiMath for formulas under any circumstances.`;
      }
    }

    const subjectName = subject ? this.getSubjectName(subject) : '학습';
    const subjectInstruction = subject ? this.getSubjectInstruction(subject) : '';
    const styleGuide =
      explainStyle === 'SHORT'
        ? '설명은 핵심만 짧고 명확하게 해줘.'
        : '설명은 차근차근 자세히, 단계별로 해줘.';

    return `너는 중고등학생을 위한 친절한 AI 튜터야. 지금은 ${subjectName} 과목을 가르치고 있어.

[성격과 말투]
- 항상 친근하고 따뜻한 선생님 말투를 사용해
- 학생이 틀려도 절대 혼내지 않아
- 짧은 격려를 자주 포함해 (예: "좋은 질문이야!", "거의 다 왔어!", "아깝다, 이 부분만 더 보면 돼!")
- 어렵게 느껴질 수 있는 내용은 "천천히 같이 해보자"라고 말해줘
- 마지막에는 항상 다음 행동을 유도해 (예: "이 부분 이해됐어? 다음은 ~를 해볼까?")

[절대 하면 안 되는 것]
- "틀렸습니다", "이해를 못했네요", "다시 공부하세요" 같은 차가운 말투 금지
- 딱딱하거나 교과서적인 말투 금지

[과목별 지침]
${subjectInstruction}

[설명 스타일]
${styleGuide}

${studentName ? `학생 이름은 ${studentName}야. 가끔 이름을 불러줘도 좋아.` : ''}

[CRITICAL LANGUAGE REQUIREMENT]
You MUST process the input and generate your response EXCLUSIVELY in the target language corresponding to the language code: "${langCode}".
If the instructions above are in Korean, you must still output your final response purely in the language of "${langCode}".
All formatting should be natural for Text-To-Speech audio output targeting the language "${langCode}".

[MATH & LATEX FORMATTING]
- ALL mathematical equations, expressions, and formulas MUST be written in LaTeX notation.
- Use $ for inline math (e.g. $x = 2$) and $$ for block math (e.g. $$x = \\frac{1}{2}$$).
- NEVER use backticks (\`) or AsciiMath for formulas under any circumstances.`;
  }

  detectQuestionType(content: string): QuestionType {
    const lower = content.toLowerCase();
    if (lower.includes('틀렸') || lower.includes('오답') || lower.includes('왜 틀')) {
      return 'wrong_answer';
    }
    if (lower.includes('풀어') || lower.includes('계산') || lower.includes('답') || lower.includes('문제')) {
      return 'solve';
    }
    if (lower.includes('뭐야') || lower.includes('뭔가요') || lower.includes('설명') || lower.includes('개념')) {
      return 'concept';
    }
    if (lower.includes('요약') || lower.includes('정리')) {
      return 'summary';
    }
    if (lower.includes('추천') || lower.includes('다음') || lower.includes('뭘 공부')) {
      return 'recommend';
    }
    return 'casual';
  }

  async generateResponse(
    messages: Array<{ role: 'user' | 'assistant'; content: string; attachmentUrl?: string }>,
    subject: Subject,
    explainStyle?: ExplainStyle,
    studentName?: string,
    mode: 'TEXT' | 'VOICE' = 'TEXT',
    lang: string = 'ko',
    segmentId?: string,
    subjectIdStr?: string,
    courseId?: string,
  ): Promise<{ text: string; audioBase64?: string }> {
    const systemPrompt = this.buildSystemPrompt(subject, explainStyle, studentName, lang, segmentId, subjectIdStr, courseId);

    if (mode === 'VOICE') {
      const cleanHistory: Array<{ role: string; parts: Array<any> }> = [];
      let lastRole = '';
      for (const m of messages.slice(0, -1)) {
        const role = m.role === 'assistant' ? 'model' : 'user';
        if (role === lastRole) continue; // Skip consecutive same-role messages
        const parts: any[] = [];
        if (m.content) parts.push({ text: m.content });
        if (m.attachmentUrl?.startsWith('data:')) {
          const [header, base64] = m.attachmentUrl.split(',');
          const mimeType = header.replace('data:', '').replace(';base64', '');
          parts.push({ inlineData: { mimeType, data: base64 } });
        }
        cleanHistory.push({ role, parts });
        lastRole = role;
      }
      const lastMessage = messages[messages.length - 1];
      const lastParts: any[] = [];
      if (lastMessage.content) lastParts.push({ text: lastMessage.content });
      if (lastMessage.attachmentUrl?.startsWith('data:')) {
        const [header, base64] = lastMessage.attachmentUrl.split(',');
        const mimeType = header.replace('data:', '').replace(';base64', '');
        lastParts.push({ inlineData: { mimeType, data: base64 } });
      }

      // Attempt 1: Audio response
      try {
        const response = await this.gemini.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            ...cleanHistory,
            { role: 'user', parts: lastParts },
          ],
          config: {
            systemInstruction: systemPrompt,
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: 'Aoede',
                },
              },
            },
          },
        });

        let text = '';
        let audioBase64 = '';

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.text) text += part.text;
            if ((part as any).inlineData?.data) {
              const rawBase64 = (part as any).inlineData.data;
              const mimeType: string = (part as any).inlineData.mimeType || 'audio/pcm';
              // Convert PCM to WAV for broad browser/mobile compatibility
              audioBase64 = mimeType.includes('pcm') ? pcmBase64ToWavBase64(rawBase64) : rawBase64;
            }
          }
        }

        if (audioBase64) {
          return { text: text || '음성 설명이 준비되었습니다.', audioBase64 };
        }

        // If audio was empty, fall through to text fallback
        console.warn('Gemini returned no audio data, falling back to text.');
      } catch (err: any) {
        console.error('Gemini Audio API Error:', err?.message || err);
      }

      // Attempt 2: Text-only fallback via Gemini
      try {
        const textResponse = await this.gemini.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            ...cleanHistory,
            { role: 'user', parts: lastParts },
          ],
          config: {
            systemInstruction: systemPrompt,
          },
        });

        const fallbackText = textResponse.candidates?.[0]?.content?.parts
          ?.map((p: any) => p.text)
          .filter(Boolean)
          .join('') || '';

        if (fallbackText) {
          return { text: fallbackText };
        }
      } catch (err2: any) {
        console.error('Gemini Text Fallback Error:', err2?.message || err2);
      }

      return { text: '현재 AI 음성 서비스에 일시적인 문제가 있어요. 잠시 후 다시 시도해 주세요!' };
    } else {
      // TEXT mode: Gemini 2.5 Flash (supports text + images natively, no OpenAI key needed)
      const geminiMessages: Array<{ role: string; parts: any[] }> = [];
      let lastRole = '';

      for (const m of messages.slice(0, -1)) {
        const role = m.role === 'assistant' ? 'model' : 'user';
        if (role === lastRole) continue;
        const parts: any[] = [];
        if (m.content && m.content.trim()) parts.push({ text: m.content });
        if (m.attachmentUrl?.startsWith('data:')) {
          const [header, base64] = m.attachmentUrl.split(',');
          const mimeType = header.replace('data:', '').replace(';base64', '');
          parts.push({ inlineData: { mimeType, data: base64 } });
        }
        if (parts.length > 0) {
          geminiMessages.push({ role, parts });
          lastRole = role;
        }
      }

      const lastMessage = messages[messages.length - 1];
      const lastParts: any[] = [];
      if (lastMessage.content && lastMessage.content.trim()) {
        lastParts.push({ text: lastMessage.content });
      }
      if (lastMessage.attachmentUrl?.startsWith('data:')) {
        const [header, base64] = lastMessage.attachmentUrl.split(',');
        const mimeType = header.replace('data:', '').replace(';base64', '');
        lastParts.push({ inlineData: { mimeType, data: base64 } });
      }

      const textResponse = await this.gemini.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          ...geminiMessages,
          { role: 'user', parts: lastParts },
        ],
        config: { systemInstruction: systemPrompt },
      });

      const text = textResponse.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text)
        .filter(Boolean)
        .join('') || '죄송해, 잠깐 문제가 생겼어.';

      return { text };
    }
  }
}
