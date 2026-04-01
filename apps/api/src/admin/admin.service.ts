import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  private async checkAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('관리자 권한이 필요합니다.');
    }
  }

  async getDashboard(userId: string) {
    await this.checkAdmin(userId);

    const [totalUsers, todayMessages, subjectStats, recentUsers, recentConversations] =
      await Promise.all([
        this.prisma.user.count({ where: { role: 'STUDENT' } }),
        this.prisma.message.count({
          where: {
            role: 'USER',
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        }),
        this.prisma.learningRecord.groupBy({
          by: ['subject'],
          _sum: { questionCount: true },
          orderBy: { _sum: { questionCount: 'desc' } },
        }),
        this.prisma.user.findMany({
          where: { role: 'STUDENT' },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, name: true, email: true, grade: true, createdAt: true },
        }),
        this.prisma.conversation.findMany({
          orderBy: { updatedAt: 'desc' },
          take: 10,
          include: {
            user: { select: { name: true, email: true } },
            messages: { take: 1, orderBy: { createdAt: 'desc' } },
          },
        }),
      ]);

    return { totalUsers, todayMessages, subjectStats, recentUsers, recentConversations };
  }

  async getUsers(userId: string) {
    await this.checkAdmin(userId);
    return this.prisma.user.findMany({
      where: { role: 'STUDENT' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        grade: true,
        createdAt: true,
        profile: true,
        learningRecords: true,
      },
    });
  }

  async getConversations(userId: string) {
    await this.checkAdmin(userId);
    return this.prisma.conversation.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: {
        user: { select: { name: true, email: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async getLearningRecords(userId: string) {
    await this.checkAdmin(userId);
    return this.prisma.learningRecord.findMany({
      include: { user: { select: { name: true, email: true, grade: true } } },
      orderBy: { lastStudiedAt: 'desc' },
    });
  }
}
