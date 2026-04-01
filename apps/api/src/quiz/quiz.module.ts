import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { StatsModule } from '../stats/stats.module';

@Module({
  imports: [StatsModule],
  providers: [QuizService],
  controllers: [QuizController]
})
export class QuizModule {}
