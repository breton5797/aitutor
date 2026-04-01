import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StudentModule } from './student/student.module';
import { ConversationModule } from './conversation/conversation.module';
import { LearningModule } from './learning/learning.module';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { BillingModule } from './billing/billing.module';
import { ReportModule } from './report/report.module';
import { RecommendationModule } from './recommendation/recommendation.module';
import { QuizModule } from './quiz/quiz.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    StudentModule,
    ConversationModule,
    LearningModule,
    AdminModule,
    AiModule,
    BillingModule,
    ReportModule,
    RecommendationModule,
    QuizModule,
    StatsModule,
  ],
})
export class AppModule {}
