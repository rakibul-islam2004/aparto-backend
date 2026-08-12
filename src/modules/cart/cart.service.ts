import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { AddCartItemDto, UpdateCartItemDto, CartResponseDto, CartItemResponseDto } from "./dto/cart.dto";

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(cartId: string): Promise<CartResponseDto> {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: { include: { variant: { include: { product: { include: { media: { where: { isPrimary: true } } } } } } } } },
    });
    if (!cart) throw new NotFoundException("Cart not found");
    return this.mapToResponse(cart);
  }

  async getOrCreateUserCart(userId: string): Promise<CartResponseDto> {
    let cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await this.prisma.cart.create({ data: { userId } });
    }
    return this.getCart(cart.id);
  }

  async getOrCreateSessionCart(sessionId: string): Promise<CartResponseDto> {
    let cart = await this.prisma.cart.findUnique({ where: { sessionId } });
    if (!cart) {
      cart = await this.prisma.cart.create({ data: { sessionId } });
    }
    return this.getCart(cart.id);
  }

  async addItem(cartId: string, dto: AddCartItemDto): Promise<CartResponseDto> {
    const cart = await this.prisma.cart.findUnique({ where: { id: cartId } });
    if (!cart) throw new NotFoundException("Cart not found");

    const variant = await this.prisma.productVariant.findUnique({ where: { id: dto.variantId } });
    if (!variant) throw new BadRequestException("Product variant not found");

    const existing = await this.prisma.cartItem.findFirst({ where: { cartId, variantId: dto.variantId } });
    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + (dto.quantity || 1) },
      });
    } else {
      await this.prisma.cartItem.create({
        data: { cartId, variantId: dto.variantId, quantity: dto.quantity || 1 },
      });
    }

    return this.getCart(cartId);
  }

  async updateItem(cartId: string, itemId: string, dto: UpdateCartItemDto): Promise<CartResponseDto> {
    const cart = await this.prisma.cart.findUnique({ where: { id: cartId } });
    if (!cart) throw new NotFoundException("Cart not found");

    const item = await this.prisma.cartItem.findFirst({ where: { id: itemId, cartId } });
    if (!item) throw new NotFoundException("Cart item not found");

    if (dto.quantity !== undefined && dto.quantity < 1) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await this.prisma.cartItem.update({ where: { id: itemId }, data: { quantity: dto.quantity } });
    }

    return this.getCart(cartId);
  }

  async removeItem(cartId: string, itemId: string): Promise<CartResponseDto> {
    const cart = await this.prisma.cart.findUnique({ where: { id: cartId } });
    if (!cart) throw new NotFoundException("Cart not found");

    await this.prisma.cartItem.deleteMany({ where: { id: itemId, cartId } });
    return this.getCart(cartId);
  }

  async clearCart(cartId: string): Promise<CartResponseDto> {
    const cart = await this.prisma.cart.findUnique({ where: { id: cartId } });
    if (!cart) throw new NotFoundException("Cart not found");

    await this.prisma.cartItem.deleteMany({ where: { cartId } });
    return this.getCart(cartId);
  }

  async mergeSessionCartToUser(sessionId: string, userId: string): Promise<CartResponseDto> {
    const sessionCart = await this.prisma.cart.findUnique({
      where: { sessionId },
      include: { items: true },
    });
    if (!sessionCart) return this.getOrCreateUserCart(userId);

    const userCart = await this.getOrCreateUserCart(userId);

    for (const sessionItem of sessionCart.items) {
      const existing = await this.prisma.cartItem.findFirst({ where: { cartId: userCart.id, variantId: sessionItem.variantId } });
      if (existing) {
        await this.prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + sessionItem.quantity },
        });
      } else {
        await this.prisma.cartItem.create({
          data: { cartId: userCart.id, variantId: sessionItem.variantId, quantity: sessionItem.quantity },
        });
      }
    }

    await this.prisma.cart.delete({ where: { id: sessionCart.id } });
    return this.getCart(userCart.id);
  }

  private mapToResponse(cart: any): CartResponseDto {
    return {
      id: cart.id,
      userId: cart.userId,
      sessionId: cart.sessionId,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
      items: cart.items.map((item: any) => this.mapItemToResponse(item)),
    };
  }

  private mapItemToResponse(item: any): CartItemResponseDto {
    const variant = item.variant;
    const product = variant?.product;
    const primaryMedia = product?.media?.find((m: any) => m.isPrimary);

    return {
      id: item.id,
      cartId: item.cartId,
      variantId: item.variantId,
      quantity: item.quantity,
      variant: variant
        ? {
            id: variant.id,
            sku: variant.sku,
            price: Number(variant.price),
            salePrice: variant.salePrice ? Number(variant.salePrice) : undefined,
            product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
              media: primaryMedia ? [{ url: primaryMedia.url, altText: primaryMedia.altText }] : [],
            },
          }
        : undefined,
    };
  }
}
