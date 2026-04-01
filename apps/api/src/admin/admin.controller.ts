import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';

@UseGuards(AuthGuard('jwt'))
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  getDashboard(@Request() req: any) {
    return this.adminService.getDashboard(req.user.id);
  }

  @Get('users')
  getUsers(@Request() req: any) {
    return this.adminService.getUsers(req.user.id);
  }

  @Get('conversations')
  getConversations(@Request() req: any) {
    return this.adminService.getConversations(req.user.id);
  }

  @Get('records')
  getLearningRecords(@Request() req: any) {
    return this.adminService.getLearningRecords(req.user.id);
  }
}
