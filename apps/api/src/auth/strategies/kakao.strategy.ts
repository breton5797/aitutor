import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-kakao';
import { Injectable } from '@nestjs/common';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor() {
    const isProd = process.env.NODE_ENV === 'production';
    super({
      clientID: process.env.KAKAO_CLIENT_ID || 'missing',
      clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
      callbackURL: (process.env.BACKEND_URL || (isProd 
        ? 'https://aitutor-api-production.up.railway.app'
        : 'http://localhost:4000')) + '/api/auth/kakao/callback',
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: any) {
    const { id, username, _json } = profile;
    const user = {
      socialId: String(id),
      provider: 'KAKAO',
      email: _json?.kakao_account?.email || `kakao_${id}@temp.com`,
      name: username || 'Kakao User',
    };
    done(null, user);
  }
}
