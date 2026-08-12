import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UpdateProfileDto, CreateAddressDto, UpdateAddressDto } from "../dto/user.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser("id") userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  updateProfile(@CurrentUser("id") userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getAll() {
    return this.usersService.getAllUsers();
  }

  @Post("me/addresses")
  @UseGuards(JwtAuthGuard)
  createAddress(@CurrentUser("id") userId: string, @Body() dto: CreateAddressDto) {
    return this.usersService.createAddress(userId, dto);
  }

  @Get("me/addresses")
  @UseGuards(JwtAuthGuard)
  getAddresses(@CurrentUser("id") userId: string) {
    return this.usersService.getAddresses(userId);
  }

  @Get("me/addresses/:id")
  @UseGuards(JwtAuthGuard)
  getAddress(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.usersService.getAddress(userId, id);
  }

  @Patch("me/addresses/:id")
  @UseGuards(JwtAuthGuard)
  updateAddress(@CurrentUser("id") userId: string, @Param("id") id: string, @Body() dto: UpdateAddressDto) {
    return this.usersService.updateAddress(userId, id, dto);
  }

  @Delete("me/addresses/:id")
  @UseGuards(JwtAuthGuard)
  deleteAddress(@CurrentUser("id") userId: string, @Param("id") id: string) {
    return this.usersService.deleteAddress(userId, id);
  }
}
