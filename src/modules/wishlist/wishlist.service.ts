import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateWishlistItemDto, WishlistResponseDto } from "./dto/wishlist.dto";

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async getWishlist(userId: string): Promise<WishlistResponseDto[]> {
    const items = await this.prisma.wishlist.findMany({
      where: { userId },
      include: { variant: { include: { product: { include: { media: { where: { isPrimary: true } } } } } } },
      orderBy: { createdAt: "desc" },
    });
    return items.map((item) => this.mapToResponse(item));
  }

  async addItem(userId: string, dto: CreateWishlistItemDto): Promise<WishlistResponseDto> {
    const existing = await this.prisma.wishlist.findFirst({ where: { userId, variantId: dto.variantId } });
    if (existing) throw new ConflictException("Item already in wishlist");

    const variant = await this.prisma.productVariant.findUnique({ where: { id: dto.variantId } });
    if (!variant) throw new NotFoundException("Product variant not found");

    const item = await this.prisma.wishlist.create({
      data: { userId, variantId: dto.variantId },
      include: { variant: { include: { product: { include: { media: { where: { isPrimary: true } } } } } } },
    });
    return this.mapToResponse(item);
  }

  async removeItem(userId: string, variantId: string): Promise<void> {
    const item = await this.prisma.wishlist.findFirst({ where: { userId, variantId } });
    if (!item) throw new NotFoundException("Wishlist item not found");
    await this.prisma.wishlist.delete({ where: { id: item.id } });
  }

  async isInWishlist(userId: string, variantId: string): Promise<boolean> {
    const item = await this.prisma.wishlist.findFirst({ where: { userId, variantId } });
    return !!item;
  }

  private mapToResponse(item: any): WishlistResponseDto {
    const variant = item.variant;
    const product = variant?.product;
    const primaryMedia = product?.media?.find((m: any) => m.isPrimary);

    return {
      id: item.id,
      userId: item.userId,
      variantId: item.variantId,
      createdAt: item.createdAt,
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
