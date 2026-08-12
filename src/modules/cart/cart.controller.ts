import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from "@nestjs/common";
import { CartService } from "./cart.service";
import { AddCartItemDto, UpdateCartItemDto } from "./dto/cart.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("cart")
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getCart(@CurrentUser("id") userId: string) {
    return this.cartService.getOrCreateUserCart(userId);
  }

  @Post("items")
  @UseGuards(JwtAuthGuard)
  async addItem(@CurrentUser("id") userId: string, @Body() dto: AddCartItemDto) {
    const cart = await this.cartService.getOrCreateUserCart(userId);
    return this.cartService.addItem(cart.id, dto);
  }

  @Patch("items/:itemId")
  @UseGuards(JwtAuthGuard)
  async updateItem(@CurrentUser("id") userId: string, @Param("itemId") itemId: string, @Body() dto: UpdateCartItemDto) {
    const cart = await this.cartService.getOrCreateUserCart(userId);
    return this.cartService.updateItem(cart.id, itemId, dto);
  }

  @Delete("items/:itemId")
  @UseGuards(JwtAuthGuard)
  async removeItem(@CurrentUser("id") userId: string, @Param("itemId") itemId: string) {
    const cart = await this.cartService.getOrCreateUserCart(userId);
    return this.cartService.removeItem(cart.id, itemId);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  async clearCart(@CurrentUser("id") userId: string) {
    const cart = await this.cartService.getOrCreateUserCart(userId);
    return this.cartService.clearCart(cart.id);
  }
}
