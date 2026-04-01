import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StudentService } from './student.service';
import { CreateProfileDto } from './dto/student.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('student')
export class StudentController {
  constructor(private studentService: StudentService) {}

  @Post('profile')
  createProfile(@Request() req: any, @Body() dto: CreateProfileDto) {
    return this.studentService.createOrUpdateProfile(req.user.id, dto);
  }

  @Get('profile')
  getProfile(@Request() req: any) {
    return this.studentService.getProfile(req.user.id);
  }
}
