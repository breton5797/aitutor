import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Subject } from '@prisma/client';

@Injectable()
export class RecommendationService {
  constructor(private prisma: PrismaService) {}

  async evaluateAfterAnswer(userId: string, subject: Subject, isCorrect: boolean) {
    if (isCorrect) return null;

    // Track errors in LearningRecord (we do this in Conversation or Quiz)
    const record = await this.prisma.learningRecord.upsert({
      where: { userId_subject: { userId, subject } },
      update: { wrongCount: { increment: 1 }, updatedAt: new Date() },
      create: { userId, subject, wrongCount: 1, lastStudiedAt: new Date() }
    });

    // Strategy 1: 3 times wrong on the same subject
    if (record.wrongCount % 3 === 0) {
      await this.prisma.recommendation.create({
        data: {
          userId,
          subject,
          type: '개념_재학습',
          message: `${subject} 과목에서 오답이 3번 이상 발생했어요. 핵심 개념을 다시 짚어보는 건 어떨까요?`
        }
      });
      return { trigger: 'concept_review', message: '오답 누적 감지! 개념 복습을 제안합니다.' };
    }

    return null;
  }

  async getRecommendations(userId: string) {
    // Return all tailored routines
    return this.prisma.recommendation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
  }
}

