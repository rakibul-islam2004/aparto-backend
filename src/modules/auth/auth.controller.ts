import { Controller, Post, Get, Body, UseGuards, Req, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
  RegisterDto,
  LoginDto,
  RefreshDto,
  SendEmailVerificationDto,
  VerifyEmailDto,
  SendPhoneVerificationDto,
  VerifyPhoneDto,
} from "./dto/auth.dto";
import { Public } from "../../common/decorators/public.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "@prisma/client";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post("refresh")
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto);
  }

  @Public()
  @Post("logout")
  logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  getMe(@CurrentUser("id") userId: string) {
    return this.authService.getMe(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Get("users")
  getUsers() {
    return this.authService.getAllUsers();
  }

  @Public()
  @Post("request-email-verification")
  requestEmailVerification(@Body() dto: SendEmailVerificationDto) {
    return this.authService.requestEmailVerification(dto.email);
  }

  @Public()
  @Post("verify-email")
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Public()
  @Post("request-phone-verification")
  requestPhoneVerification(@Body() dto: SendPhoneVerificationDto) {
    return this.authService.requestPhoneVerification(dto.phone);
  }

  @Public()
  @Post("verify-phone")
  verifyPhone(@Body() dto: VerifyPhoneDto) {
    return this.authService.verifyPhone(dto.token);
  }

  @Public()
  @Get("oauth/google")
  @UseGuards(AuthGuard("google"))
  googleAuth() {
    // initiates Google OAuth2 login flow
  }

  @Public()
  @Get("oauth/google/callback")
  @UseGuards(AuthGuard("google"))
  async googleAuthRedirect(@Req() req: any, @Res() res: any) {
    // req.user is populated by GoogleStrategy
    const user = req.user;
    const tokens = await this.authService.createSessionAndTokens(user.id, user.email);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
  }

  @Public()
  @Get("oauth/facebook")
  @UseGuards(AuthGuard("facebook"))
  facebookAuth() {
    // initiates Facebook OAuth2 login flow
  }

  @Public()
  @Get("oauth/facebook/callback")
  @UseGuards(AuthGuard("facebook"))
  async facebookAuthRedirect(@Req() req: any, @Res() res: any) {
    // req.user is populated by FacebookStrategy
    const user = req.user;
    const tokens = await this.authService.createSessionAndTokens(user.id, user.email);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
  }
}
