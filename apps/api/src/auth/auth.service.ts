import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('이미 사용 중인 이메일입니다.');

    const hashed = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        name: dto.name,
        grade: dto.grade,
      },
    });

    const token = this.generateToken(user.id, user.email, user.role);
    return { token, user: this.sanitizeUser(user) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');

    const match = user.password && await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');

    const token = this.generateToken(user.id, user.email, user.role, dto.autoLogin);
    return { token, user: this.sanitizeUser(user) };
  }

  async resetPassword(dto: any) { // using any inline or import ResetPasswordDto if available
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('가입되지 않은 이메일입니다.');
    if (user.provider !== 'LOCAL') throw new UnauthorizedException('소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.');
    
    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { email: dto.email },
      data: { password: hashed },
    });
    return { success: true };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) throw new UnauthorizedException();
    return this.sanitizeUser(user);
  }

  async validateOAuthLogin(socialUser: any) {
    const { email, name, provider, socialId } = socialUser;
    
    // 이메일이나 소셜ID로 기존 유저 확인
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { socialId },
          { email },
        ],
      },
    });

    if (!user) {
      // 새 유저 가입 (소셜 유저는 비밀번호 없이 가입)
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          provider: provider as any,
          socialId,
          grade: 'GENERAL', // 기본값으로 일반 세그먼트 부여
        },
      });
    } else if (!user.socialId) {
      // 기존 로컬가입 유저가 소셜 로그인 시도 시 연동 연동
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          provider: provider as any,
          socialId,
        },
      });
    }

    const token = this.generateToken(user.id, user.email, user.role);
    return { token, user: this.sanitizeUser(user) };
  }

  private generateToken(userId: string, email: string, role: string, autoLogin?: boolean) {
    return this.jwtService.sign(
      { sub: userId, email, role },
      autoLogin ? { expiresIn: '30d' } : undefined
    );
  }

  private sanitizeUser(user: any) {
    const { password, ...rest } = user;
    return rest;
  }
}
