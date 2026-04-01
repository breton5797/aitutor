import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportService } from './report.service';

@UseGuards(AuthGuard('jwt'))
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('student')
  getStudentReport(@Request() req: any) {
    return this.reportService.getStudentReport(req.user.id);
  }

  @Get('parent')
  getParentReport(@Request() req: any) {
    return this.reportService.getParentReport(req.user.id);
  }
}

