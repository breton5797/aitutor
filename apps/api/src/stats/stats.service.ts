import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getUserStats(userId: string) {
    let stats = await this.prisma.userStats.findUnique({
      where: { userId },
      include: { user: { include: { achievements: true } } }
    });

    if (!stats) {
      stats = await this.prisma.userStats.create({
        data: { userId, xp: 0, level: 1, streakDays: 1, lastStudyDate: new Date() },
        include: { user: { include: { achievements: true } } }
      });
    }
    return stats;
  }

  async addXP(userId: string, gainedXP: number) {
    const stats = await this.getUserStats(userId);
    const newXP = stats.xp + gainedXP;
    const newLevel = Math.floor(newXP / 100) + 1; // 100 XP per level

    const now = new Date();
    const lastDate = stats.lastStudyDate;
    
    // Streak calculation
    let newStreak = stats.streakDays;
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays === 1) {
      // Studied the next day, add streak
      newStreak += 1;
    } else if (diffDays > 1 && now.getDate() !== lastDate.getDate()) {
      // Missed a day, reset streak
      newStreak = 1;
    }

    const updated = await this.prisma.userStats.update({
      where: { userId },
      data: { xp: newXP, level: newLevel, streakDays: newStreak, lastStudyDate: now }
    });

    // Check for badge
    await this.checkAndAwardBadges(userId, newLevel, newStreak);

    return { ...updated, leveledUp: newLevel > stats.level };
  }

  private async checkAndAwardBadges(userId: string, level: number, streak: number) {
    const defaultBadges: string[] = [];
    if (level >= 10) defaultBadges.push('레벨 마스터 (Lv.10)');
    if (streak >= 7) defaultBadges.push('일주일 꾸준함 배지');

    for (const badge of defaultBadges) {
      const existing = await this.prisma.achievement.findFirst({
        where: { userId, badgeType: badge }
      });
      if (!existing) {
        await this.prisma.achievement.create({
          data: { userId, badgeType: badge }
        });
      }
    }
  }
}

