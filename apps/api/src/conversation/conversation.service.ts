import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { StatsService } from '../stats/stats.service';
import { RecommendationService } from '../recommendation/recommendation.service';
import { CreateConversationDto, SendMessageDto } from './dto/conversation.dto';

// 플랜별 일일 메시지 한도
const PLAN_DAILY_LIMIT: Record<string, number> = {
  FREE: 5,
  BASIC: 100,
  PREMIUM: 500,
  PARENT: 100, // PARENT는 BASIC과 동일
};

@Injectable()
export class ConversationService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private statsService: StatsService,
    private recService: RecommendationService,
  ) {}

  async getConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async createConversation(userId: string, dto: CreateConversationDto) {
    return this.prisma.conversation.create({
      data: {
        userId,
        subject: dto.subject,
        segmentId: dto.segmentId,
        subjectId: dto.subjectId,
        courseId: dto.courseId,
        title: dto.title || (dto.subject ? this.getDefaultTitle(dto.subject) : '새 대화'),
      },
    });
  }

  async getMessages(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conversation) throw new NotFoundException('대화를 찾을 수 없습니다.');

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(userId: string, conversationId: string, dto: SendMessageDto) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conversation) throw new NotFoundException('대화를 찾을 수 없습니다.');

    // 플랜 확인 후 일일 메시지 제한 체크
    await this.checkDailyLimit(userId);

    // 질문 유형 감지
    const questionType = this.aiService.detectQuestionType(dto.content);

    // 사용자 메시지 저장
    const userMessage = await this.prisma.message.create({
      data: {
        conversationId,
        role: 'USER',
        content: dto.content,
        questionType,
        attachmentUrl: dto.attachmentUrl,
      },
    });

    // 이전 대화 기록 가져오기 (최근 10개)
    const history = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    // 학생 프로필 가져오기
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    // AI 응답 생성
    const aiMessages = history.map((m) => ({
      role: m.role === 'USER' ? ('user' as const) : ('assistant' as const),
      content: m.content,
      attachmentUrl: m.attachmentUrl || undefined,
    }));

    let aiContent: string;
    let audioBase64: string | undefined;
    try {
      const response = await this.aiService.generateResponse(
        aiMessages,
        conversation.subject as any,
        profile?.explainStyle,
        user?.name,
        dto.mode || 'TEXT',
        dto.lang || 'ko',
        conversation.segmentId || undefined,
        conversation.subjectId || undefined,
        conversation.courseId || undefined,
      );
      aiContent = response.text;
      audioBase64 = response.audioBase64;
    } catch {
      aiContent = '지금 잠깐 연결이 어려워. 잠시 후 다시 물어봐줄래? 😊';
    }

    // AI 응답 저장
    const aiMessage = await this.prisma.message.create({
      data: {
        conversationId,
        role: 'ASSISTANT',
        content: aiContent,
        questionType,
      },
    });

    // 학습 기록 업데이트
    if (conversation.subject) {
      await this.updateLearningRecord(userId, conversation.subject, questionType);
    }

    // 🏆 Gamification: XP 추가 (채팅 메시지 1회당 10 XP)
    const statsResult = await this.statsService.addXP(userId, 10);
    
    // 💡 Recommendation: 오답일 경우 분석 및 추천 로직 가동
    let recommendation: any = null;
    if (questionType === 'wrong_answer' && conversation.subject) {
      recommendation = await this.recService.evaluateAfterAnswer(userId, conversation.subject, false);
    }

    // 대화 제목 업데이트 (첫 메시지일 때)
    const msgCount = await this.prisma.message.count({ where: { conversationId } });
    if (msgCount <= 2) {
      const shortContent = dto.content.substring(0, 30);
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          title: shortContent + (dto.content.length > 30 ? '...' : ''),
          updatedAt: new Date(),
        },
      });
    } else {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
    }

    return { userMessage, aiMessage, audioBase64, leveledUp: statsResult?.leveledUp, recommendation };
  }

  private async updateLearningRecord(userId: string, subject: any, questionType: string) {
    const isWrong = questionType === 'wrong_answer';
    await this.prisma.learningRecord.upsert({
      where: { userId_subject: { userId, subject } },
      create: {
        userId,
        subject,
        questionCount: 1,
        wrongCount: isWrong ? 1 : 0,
        lastStudiedAt: new Date(),
      },
      update: {
        questionCount: { increment: 1 },
        wrongCount: isWrong ? { increment: 1 } : undefined,
        lastStudiedAt: new Date(),
      },
    });
  }

  private getDefaultTitle(subject: string): string {
    const map: Record<string, string> = {
      ENGLISH: '영어 학습',
      MATH: '수학 학습',
      SCIENCE: '과학 학습',
      HISTORY: '역사 학습',
    };
    return map[subject] || '새 대화';
  }

  /** 플랜별 일일 메시지 제한 확인 및 카운터 증가 */
  private async checkDailyLimit(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!user) return;

    const planType = user.subscriptions[0]?.planType || 'FREE';
    const limit = PLAN_DAILY_LIMIT[planType] ?? 5;

    // 날짜가 바뀌면 카운터 리셋
    const now = new Date();
    const resetDate = new Date(user.dailyMsgReset);
    const needsReset =
      now.getUTCFullYear() !== resetDate.getUTCFullYear() ||
      now.getUTCMonth() !== resetDate.getUTCMonth() ||
      now.getUTCDate() !== resetDate.getUTCDate();

    if (needsReset) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { dailyMsgCount: 1, dailyMsgReset: now },
      });
      return; // 리셋 후 첫 메시지 → 허용
    }

    if (user.dailyMsgCount >= limit) {
      const planLabel = { FREE: '무료', BASIC: 'BASIC', PREMIUM: 'PREMIUM', PARENT: 'BASIC' }[planType];
      throw new HttpException(
        {
          statusCode: 402,
          message: `오늘 ${planLabel} 플랜의 AI 응답 한도(${limit}회)를 초과했습니다. 업그레이드하면 더 많이 사용할 수 있어요!`,
          upgradeRequired: true,
          currentPlan: planType,
          limit,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    // 카운터 증가
    await this.prisma.user.update({
      where: { id: userId },
      data: { dailyMsgCount: { increment: 1 } },
    });
  }
}
