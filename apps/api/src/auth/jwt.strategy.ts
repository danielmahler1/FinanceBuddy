import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import * as dotenv from 'dotenv';
import { PrismaService } from 'src/prisma.service';
import type { Request } from 'express';

dotenv.config();

type JwtPayload = {
  sub: string; // e.g. "auth0|abc123" or "google-oauth2|xyz"
  iss: string;
  aud: string | string[];
  scope?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
};

export interface JwtUser {
  userId: string;
  provider: string;
  providerId: string;
  sub: string;
  scopes: string[];
}

function splitSub(sub: string) {
  // "provider|id" → { provider, providerId }
  const [provider, ...rest] = sub.split('|');
  return { provider, providerId: rest.join('|') };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${process.env.AUTH0_ISSUER_URL}.well-known/jwks.json`,
      }),

      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: process.env.AUTH0_AUDIENCE,
      issuer: `${process.env.AUTH0_ISSUER_URL}`,
      algorithms: ['RS256'],
      passReqToCallback: true,
    });
  }

  private async fetchUserInfo(token: string): Promise<{
    email?: string;
    given_name?: string;
    family_name?: string;
  }> {
    const res = await fetch(`${process.env.AUTH0_ISSUER_URL}userinfo`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`userinfo failed: ${res.status}`);
    }
    return (await res.json()) as any;
  }

  async validate(req: Request, payload: JwtPayload): Promise<JwtUser> {
    // You can see the JWT here
    // console.log('JWT payload', payload);

    const { sub } = payload;
    const { provider, providerId } = splitSub(sub);

    let profile: { email?: string; given_name?: string; family_name?: string } | undefined;
    try {
      const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      if (token) {
        profile = await this.fetchUserInfo(token).catch(() => undefined);
      }
    } catch {
      // ignore userinfo failures; proceed with whatever we have
    }

    // 1) Find Authentication by provider+providerId
    let auth = await this.prisma.authentication.findFirst({
      where: { provider, providerId },
      include: { user: true },
    });

    // 2) If missing, create User and Authentication
    if (!auth) {
      await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: profile?.email ?? payload.email ?? `${providerId}@${provider}.placeholder`,
          },
        });

        await tx.authentication.create({
          data: {
            provider,
            providerId,
            userId: user.id,
          },
        });

        await tx.user.update({
          where: { id: user.id },
          data: {
            email: profile?.email ?? payload.email ?? undefined,
            firstName: profile?.given_name ?? undefined,
            lastName: profile?.family_name ?? undefined,
          },
        });
      });

      auth = await this.prisma.authentication.findFirst({
        where: { provider, providerId },
        include: { user: true },
      });
    } else {
      // 3) Update user profile fields opportunistically (only if they're empty)
      const updates: Record<string, string> = {};
      const email = profile?.email ?? payload.email;
      if (email) updates.email = email;
      // Only update firstName/lastName if they're currently empty in the database
      if (profile?.given_name && !auth.user.firstName) updates.firstName = profile.given_name;
      if (profile?.family_name && !auth.user.lastName) updates.lastName = profile.family_name;
      if (Object.keys(updates).length) {
        await this.prisma.user.update({ where: { id: auth.userId }, data: updates });
      }
    }

    return {
      userId: auth.userId,
      provider,
      providerId,
      sub,
      scopes: (payload.scope ?? '').split(' ').filter(Boolean),
    } as JwtUser;
  }
}
