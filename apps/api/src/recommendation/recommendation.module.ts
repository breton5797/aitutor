import { Module } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { RecommendationController } from './recommendation.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [RecommendationService, PrismaService],
  controllers: [RecommendationController],
  exports: [RecommendationService],
})
export class RecommendationModule {}
