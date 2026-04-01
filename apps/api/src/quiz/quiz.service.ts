import { Injectable } from '@nestjs/common';
import { Subject } from '@prisma/client';
import { StatsService } from '../stats/stats.service';

@Injectable()
export class QuizService {
  constructor(private statsService: StatsService) {}

  getQuiz(subject: Subject, level: number) {
    // Generate a simple math or english quiz
    const quizzes = {
      MATH: { q: '12 * 8 = ?', type: '빠른계산', options: ['86', '96', '106', '116'], answer: '96' },
      ENGLISH: { q: 'Apple 의 뜻은?', type: '단어', options: ['사과', '바나나', '포도'], answer: '사과' },
      SCIENCE: { q: '물은 H2O이다. (O/X)', type: 'OX', options: ['O', 'X'], answer: 'O' },
      HISTORY: { q: '조선 건국연도는?', type: '연도', options: ['1392', '1492'], answer: '1392' }
    };
    return quizzes[subject] || quizzes.MATH;
  }

  async submitQuiz(userId: string, subject: Subject, isCorrect: boolean) {
    if (isCorrect) {
      // Award 20 XP for correct quiz
      return await this.statsService.addXP(userId, 20);
    }
    return { leveledUp: false, message: '틀렸습니다. 하지만 경험치는 깎이지 않아요!' };
  }
}

