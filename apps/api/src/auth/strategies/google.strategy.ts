import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    const isProd = process.env.NODE_ENV === 'production';
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || 'missing',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'missing',
      callbackURL: (process.env.BACKEND_URL || (isProd 
        ? 'https://aitutor-api-production.up.railway.app'
        : 'http://localhost:4000')) + '/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { id, name, emails } = profile;
    const user = {
      socialId: id,
      provider: 'GOOGLE',
      email: emails?.[0]?.value,
      name: name?.givenName || profile.displayName || 'Google User',
    };
    done(null, user);
  }
}
