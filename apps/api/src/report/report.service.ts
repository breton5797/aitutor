import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async getStudentReport(userId: string) {
    // Generate a basic report for the student
    const records = await this.prisma.learningRecord.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      type: 'STUDENT',
      summary: '지난 7일간 꾸준히 공부했어요! 🎉',
      data: records,
    };
  }

  async getParentReport(userId: string) {
    // Fetch parent report containing more details & risks
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscriptions: { where: { status: 'ACTIVE' } } },
    });

    if (!user) throw new NotFoundException('User not found.');

    const activePlan = user.subscriptions[0]?.planType || 'FREE';

    // Retrieve fake or real report based on plan
    const records = await this.prisma.learningRecord.findMany({
      where: { userId },
    });

    const isLocked = activePlan === 'FREE' || activePlan === 'BASIC';

    if (isLocked) {
      // Mock / Blurred data for free or basic users to encourage upgrade
      return {
        type: 'PARENT',
        isLocked,
        message: '프리미엄 구독을 하시면 자녀의 약점과 오답 데이터를 정밀하게 분석할 수 있습니다.',
        mockData: {
          totalStudyTime: '??? 시간',
          weakness: '모자이크 처리된 취약점 표기',
          aiComment: '현재 요금제에서는 상세 코멘트를 지원하지 않습니다.',
        },
      };
    }

    // Full Premium/Parent Plan data
    return {
      type: 'PARENT',
      isLocked: false,
      data: {
        totalStudyTime: '4시간 20분',
        weaknesses: ['영어 - 관계대명사', '수학 - 일차방정식 활용'],
        recentErrors: 12,
        aiComment: `최근 ${user.name} 학생이 영어를 집중해서 풀고 있지만 오답률이 약간 높습니다. 추천 학습을 유도하겠습니다!`,
        records,
      },
    };
  }
}

