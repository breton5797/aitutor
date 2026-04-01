import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RecommendationService } from './recommendation.service';

@UseGuards(AuthGuard('jwt'))
@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get()
  getRecommendations(@Request() req: any) {
    return this.recommendationService.getRecommendations(req.user.id);
  }
}

