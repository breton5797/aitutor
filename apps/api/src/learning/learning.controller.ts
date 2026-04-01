import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LearningService } from './learning.service';

@UseGuards(AuthGuard('jwt'))
@Controller('learning')
export class LearningController {
  constructor(private learningService: LearningService) {}

  @Get('records')
  getRecords(@Request() req: any) {
    return this.learningService.getRecords(req.user.id);
  }

  @Get('recommendations')
  getRecommendations(@Request() req: any) {
    return this.learningService.getRecommendations(req.user.id);
  }
}
