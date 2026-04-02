import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-naver';
import { Injectable } from '@nestjs/common';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor() {
    const isProd = process.env.NODE_ENV === 'production';
    super({
      clientID: process.env.NAVER_CLIENT_ID || 'missing',
      clientSecret: process.env.NAVER_CLIENT_SECRET || 'missing',
      callbackURL: isProd 
        ? 'https://aitutor-api-production.up.railway.app/api/auth/naver/callback'
        : 'http://localhost:4000/api/auth/naver/callback',
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: any) {
    const { id, emails, displayName } = profile;
    const user = {
      socialId: id,
      provider: 'NAVER',
      email: emails?.[0]?.value || `naver_${id}@temp.com`,
      name: displayName || 'Naver User',
    };
    done(null, user);
  }
}
