import { Module } from '@nestjs/common';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { AiModule } from '../ai/ai.module';
import { StatsModule } from '../stats/stats.module';
import { RecommendationModule } from '../recommendation/recommendation.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [AiModule, StatsModule, RecommendationModule],
  controllers: [ConversationController],
  providers: [ConversationService, PrismaService],
})
export class ConversationModule {}
