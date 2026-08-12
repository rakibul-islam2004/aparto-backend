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
        createdAt: true,
        profile: true,
      },
    });
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
      await this.prisma.session.deleteMany({ where: { sessionToken: sid } });
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  }
}
