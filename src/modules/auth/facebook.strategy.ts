import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({
      clientID: config.get<string>('FACEBOOK_CLIENT_ID'),
      clientSecret: config.get<string>('FACEBOOK_CLIENT_SECRET'),
      callbackURL: config.get<string>('FACEBOOK_CALLBACK_URL') || '/auth/oauth/facebook/callback',
      profileFields: ['id', 'displayName', 'emails'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) {
    try {
      const provider = 'facebook';
      const providerAccountId = profile.id;
      const email = profile.emails?.[0]?.value;

      let account = await this.prisma.account.findUnique({ where: { provider_providerAccountId: { provider, providerAccountId } } });
      if (account) {
        const user = await this.prisma.user.findUnique({ where: { id: account.userId } });
        return done(null, user);
      }

      let user = null;
      if (email) user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await this.prisma.user.create({ data: { email, name: profile.displayName, emailVerified: !!email }, select: { id: true, email: true, name: true } });
      }

      await this.prisma.account.create({ data: { userId: user.id, provider, providerAccountId } });
      return done(null, user);
    } catch (err) {
      return done(err, false);
    }
  }
}
