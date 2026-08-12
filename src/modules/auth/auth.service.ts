import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../database/prisma.service";
import { RegisterDto, LoginDto, RefreshDto } from "./dto/auth.dto";
import { randomBytes } from "crypto";

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
    if (existing) throw new ConflictException("Email already registered");

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        phone: dto.phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    const session = await this.createSession(user.id);
    return {
      user,
      ...this.generateTokens(user.id, user.email, session.sessionToken),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user?.password) throw new UnauthorizedException("Invalid credentials");

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException("Invalid credentials");

    const session = await this.createSession(user.id);
    await this.auditLog(user.id, "LOGIN", "User", user.id, {
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
      },
      ...this.generateTokens(user.id, user.email, session.sessionToken),
    };
  }

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        emailVerified: true,
        phoneVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        profile: true,
      },
    });
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        emailVerified: true,
        phoneVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async requestEmailVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException("User not found");
    if (user.emailVerified) return { message: "Email already verified" };

    const token = await this.createVerificationToken(user.id, "EMAIL");
    await this.auditLog(
      user.id,
      "REQUEST_EMAIL_VERIFICATION",
      "User",
      user.id,
      {
        email: user.email,
      },
    );

    return {
      message: "Email verification token generated",
      token,
    };
  }

  async verifyEmail(token: string) {
    const verification = await this.prisma.verificationToken.findUnique({
      where: { token },
    });
    if (!verification || verification.type !== "EMAIL") {
      throw new UnauthorizedException("Invalid verification token");
    }
    if (verification.expires < new Date()) {
      throw new UnauthorizedException("Verification token expired");
    }

    await this.prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerified: true },
    });
    await this.prisma.verificationToken.delete({
      where: { id: verification.id },
    });
    await this.auditLog(
      verification.userId,
      "VERIFY_EMAIL",
      "User",
      verification.userId,
      {
        token: verification.token,
      },
    );

    return { message: "Email verified successfully" };
  }

  async requestPhoneVerification(phone: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) throw new UnauthorizedException("User not found");
    if (user.phoneVerified) return { message: "Phone already verified" };

    const token = await this.createVerificationToken(user.id, "PHONE");
    await this.auditLog(
      user.id,
      "REQUEST_PHONE_VERIFICATION",
      "User",
      user.id,
      {
        phone: user.phone,
      },
    );

    return {
      message: "Phone verification token generated",
      token,
    };
  }

  async verifyPhone(token: string) {
    const verification = await this.prisma.verificationToken.findUnique({
      where: { token },
    });
    if (!verification || verification.type !== "PHONE") {
      throw new UnauthorizedException("Invalid verification token");
    }
    if (verification.expires < new Date()) {
      throw new UnauthorizedException("Verification token expired");
    }

    await this.prisma.user.update({
      where: { id: verification.userId },
      data: { phoneVerified: true },
    });
    await this.prisma.verificationToken.delete({
      where: { id: verification.id },
    });
    await this.auditLog(
      verification.userId,
      "VERIFY_PHONE",
      "User",
      verification.userId,
      {
        token: verification.token,
      },
    );

    return { message: "Phone verified successfully" };
  }

  private async createSession(userId: string) {
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return this.prisma.session.create({
      data: {
        sessionToken: token,
        userId,
        expires,
      },
    });
  }

  private async createVerificationToken(
    userId: string,
    type: "EMAIL" | "PHONE",
  ) {
    const token = randomBytes(24).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    const existingTokens = await this.prisma.verificationToken.findMany({
      where: { userId, type },
    });
    if (existingTokens.length) {
      await this.prisma.verificationToken.deleteMany({
        where: { userId, type },
      });
    }

    const record = await this.prisma.verificationToken.create({
      data: {
        userId,
        type,
        token,
        expires,
      },
    });
    return record.token;
  }

  private async auditLog(
    userId: string | null,
    action: string,
    entity: string,
    entityId?: string,
    changes?: any,
  ) {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        changes,
      },
    });
  }

  private generateTokens(userId: string, email: string, sessionToken: string) {
    const payload = { sub: userId, email, sid: sessionToken };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: "15m" }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: "30d" }),
    };
  }

  async refresh(dto: RefreshDto) {
    try {
      const decoded = this.jwtService.verify(dto.refreshToken);
      const userId = decoded.sub as string;
      const sid = decoded.sid as string;

      const session = await this.prisma.session.findUnique({
        where: { sessionToken: sid },
      });
      if (
        !session ||
        session.userId !== userId ||
        session.expires < new Date()
      ) {
        throw new UnauthorizedException("Invalid or expired refresh token");
      }

      // rotate session token
      const newToken = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await this.prisma.session.update({
        where: { id: session.id },
        data: { sessionToken: newToken, expires },
      });

      await this.auditLog(userId, "REFRESH_TOKEN", "Session", session.id, {
        oldSessionToken: sid,
      });

      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      return this.generateTokens(user.id, user.email, newToken);
    } catch (err) {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async logout(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken);
      const sid = decoded.sid as string;
      const deleted = await this.prisma.session.deleteMany({
        where: { sessionToken: sid },
      });
      if (deleted.count > 0) {
        await this.auditLog(decoded.sub as string, "LOGOUT", "Session", sid);
      }
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  }

  // Public helper to create session and tokens for OAuth flows or external callers
  async createSessionAndTokens(userId: string, email: string) {
    const session = await this.createSession(userId);
    const tokens = this.generateTokens(userId, email, session.sessionToken);
    return { userId, ...tokens };
  }
}
