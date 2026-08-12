import { Controller, Post, Get, Body, UseGuards, Req } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto, RefreshDto } from "./dto/auth.dto";
import { Public } from "../../common/decorators/public.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthGuard } from "@nestjs/passport";

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

  @Public()
  @Get("oauth/google")
  @UseGuards(AuthGuard("google"))
  googleAuth() {
    // initiates Google OAuth2 login flow
  }

  @Public()
  @Get("oauth/google/callback")
  @UseGuards(AuthGuard("google"))
  async googleAuthRedirect(@Req() req: any) {
    // req.user is populated by GoogleStrategy
    const user = req.user;
    return this.authService.createSessionAndTokens(user.id, user.email);
  }

}
