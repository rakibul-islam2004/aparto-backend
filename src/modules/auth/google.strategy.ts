import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL') || '/auth/oauth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) {
    try {
      const provider = 'google';
      const providerAccountId = profile.id;
      const email = profile.emails?.[0]?.value;

      // find existing account
      let account = await this.prisma.account.findUnique({ where: { provider_providerAccountId: { provider, providerAccountId } } });
      if (account) {
        const user = await this.prisma.user.findUnique({ where: { id: account.userId } });
        return done(null, user);
      }

      // find user by email
      let user = null;
      if (email) {
        user = await this.prisma.user.findUnique({ where: { email } });
      }

      if (!user) {
        user = await this.prisma.user.create({ data: { email, name: profile.displayName, emailVerified: !!email }, select: { id: true, email: true, name: true } });
      }

      // create account link
      await this.prisma.account.create({ data: { userId: user.id, provider, providerAccountId } });

      return done(null, user);
    } catch (err) {
      return done(err, false);
    }
  }
}
