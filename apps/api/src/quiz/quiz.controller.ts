import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { QuizService } from './quiz.service';
import { Subject } from '@prisma/client';

@UseGuards(AuthGuard('jwt'))
@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get()
  getQuiz(@Query('subject') subject: Subject, @Query('level') level: string) {
    return this.quizService.getQuiz(subject, parseInt(level) || 1);
  }

  @Post('submit')
  submitQuiz(@Request() req: any, @Body() body: { subject: Subject; isCorrect: boolean }) {
    return this.quizService.submitQuiz(req.user.id, body.subject, body.isCorrect);
  }
}

