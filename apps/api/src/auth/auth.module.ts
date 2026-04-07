import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { NaverStrategy } from './strategies/naver.strategy';
import { KakaoStrategy } from './strategies/kakao.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'aitutor-secret',
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '1h') as any },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, NaverStrategy, KakaoStrategy],
  exports: [JwtModule],
})
export class AuthModule {}
