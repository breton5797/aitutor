import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Subject } from '@prisma/client';

@Injectable()
export class LearningService {
  constructor(private prisma: PrismaService) {}

  async getRecords(userId: string) {
    const records = await this.prisma.learningRecord.findMany({
      where: { userId },
      orderBy: { lastStudiedAt: 'desc' },
    });

    const recentQuestions = await this.prisma.message.findMany({
      where: {
        conversation: { userId },
        role: 'USER',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        conversation: { select: { subject: true, id: true, title: true } },
      },
    });

    // 최근 7일 학습 횟수
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyCount = await this.prisma.message.count({
      where: {
        conversation: { userId },
        role: 'USER',
        createdAt: { gte: sevenDaysAgo },
      },
    });

    return { records, recentQuestions, weeklyCount };
  }

  async getRecommendations(userId: string) {
    const records = await this.prisma.learningRecord.findMany({
      where: { userId },
      orderBy: { lastStudiedAt: 'desc' },
    });

    const recommendations: Array<{
      subject: Subject;
      message: string;
      type: string;
    }> = [];

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    for (const record of records) {
      // 오답이 많은 과목
      if (record.wrongCount >= 3) {
        const subjectName = this.getSubjectName(record.subject);
        recommendations.push({
          subject: record.subject,
          message: `${subjectName} 오답 복습을 먼저 해보자! 틀린 부분만 다시 보면 금방 잡혀 💪`,
          type: 'wrong_review',
        });
      }

      // 동일 과목 3회 이상 질문
      if (record.questionCount >= 3 && record.wrongCount < 3) {
        const subjectName = this.getSubjectName(record.subject);
        recommendations.push({
          subject: record.subject,
          message: `${subjectName}을 꾸준히 공부하고 있네! 오늘도 복습 카드로 마무리해볼까? 🌟`,
          type: 'review_card',
        });
      }

      // 3일 이상 학습 없음
      if (record.lastStudiedAt < threeDaysAgo) {
        const subjectName = this.getSubjectName(record.subject);
        recommendations.push({
          subject: record.subject,
          message: `${subjectName} 공부한 지 좀 됐지? 가볍게 개념만 다시 훑어보자 😊`,
          type: 'return',
        });
      }
    }

    // 과목별 특화 추천
    const mathRecord = records.find((r) => r.subject === 'MATH');
    if (mathRecord && mathRecord.wrongCount >= 2) {
      recommendations.push({
        subject: 'MATH',
        message: '수학 유형 문제를 다시 보면 실수가 줄어들어! 한번 해볼까? 📐',
        type: 'math_type',
      });
    }

    const englishRecord = records.find((r) => r.subject === 'ENGLISH');
    if (englishRecord && englishRecord.questionCount >= 2) {
      recommendations.push({
        subject: 'ENGLISH',
        message: '영어 문장 해석 연습을 이어서 하면 독해 실력이 쑥 올라가! 📖',
        type: 'english_reading',
      });
    }

    // 학습 기록이 없으면 기본 추천
    if (records.length === 0) {
      recommendations.push({
        subject: 'MATH',
        message: '오늘 수학부터 시작해볼까? 기초 개념부터 차근차근 같이 해보자! 😄',
        type: 'start',
      });
      recommendations.push({
        subject: 'ENGLISH',
        message: '영어 단어나 문장 해석도 AI 튜터랑 같이 하면 훨씬 재미있어! ✨',
        type: 'start',
      });
    }

    // 최대 3개만 반환
    return recommendations.slice(0, 3);
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
}
