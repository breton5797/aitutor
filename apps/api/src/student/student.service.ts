import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfileDto } from './dto/student.dto';

@Injectable()
export class StudentService {
  constructor(private prisma: PrismaService) {}

  async createOrUpdateProfile(userId: string, dto: CreateProfileDto) {
    return this.prisma.studentProfile.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: { ...dto },
    });
  }

  async getProfile(userId: string) {
    return this.prisma.studentProfile.findUnique({ where: { userId } });
  }
}
