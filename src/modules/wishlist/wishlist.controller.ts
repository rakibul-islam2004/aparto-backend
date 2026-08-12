import { Controller, Get, Post, Body, Param, Delete, UseGuards } from "@nestjs/common";
import { WishlistService } from "./wishlist.service";
import { CreateWishlistItemDto } from "./dto/wishlist.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("wishlist")
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getWishlist(@CurrentUser("id") userId: string) {
    return this.wishlistService.getWishlist(userId);
  }

  @Post("items")
  @UseGuards(JwtAuthGuard)
  async addItem(@CurrentUser("id") userId: string, @Body() dto: CreateWishlistItemDto) {
    return this.wishlistService.addItem(userId, dto);
  }

  @Delete("items/:variantId")
  @UseGuards(JwtAuthGuard)
  async removeItem(@CurrentUser("id") userId: string, @Param("variantId") variantId: string) {
    return this.wishlistService.removeItem(userId, variantId);
  }
}
