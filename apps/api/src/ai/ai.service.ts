import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { Subject, QuestionType, ExplainStyle } from '@prisma/client';

@Injectable()
export class AiService {
  private openai: OpenAI;
  private gemini: GoogleGenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
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
    return instructions[subject];
  }

  private buildSystemPrompt(
    subject: Subject,
    explainStyle?: ExplainStyle,
    studentName?: string,
  ): string {
    const subjectName = this.getSubjectName(subject);
    const subjectInstruction = this.getSubjectInstruction(subject);
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

항상 한국어로 답해줘.`;
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
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    subject: Subject,
    explainStyle?: ExplainStyle,
    studentName?: string,
    mode: 'TEXT' | 'VOICE' = 'TEXT',
  ): Promise<{ text: string; audioBase64?: string }> {
    const systemPrompt = this.buildSystemPrompt(subject, explainStyle, studentName);

    if (mode === 'VOICE') {
      const history = messages.slice(0, -1).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
      const lastMessage = messages[messages.length - 1];

      try {
        const response = await this.gemini.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: [
            { role: 'user', parts: [{ text: `[System Instructions]\n${systemPrompt}` }] },
            ...history,
            { role: 'user', parts: [{ text: lastMessage.content }] },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: 'Aoede', // Friendly voice
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
            if (part.inlineData?.data) {
              audioBase64 = part.inlineData.data;
            }
          }
        }

        return { text: text || '음성 설명이 준비되었습니다.', audioBase64 };
      } catch (err) {
        console.error('Gemini API Error:', err);
        return { text: 'Gemini 연결 중 문제가 발생했어. 문자로 먼저 알려줄게!' };
      }
    } else {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_tokens: 1500,
        temperature: 0.7,
      });

      return { text: response.choices[0].message.content || '죄송해, 잠깐 문제가 생겼어.' };
    }
  }
}
