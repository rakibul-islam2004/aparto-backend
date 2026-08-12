import { IsString } from "class-validator";

export class CreateWishlistItemDto {
  @IsString()
  variantId: string;
}

export class WishlistResponseDto {
  id: string;
  userId: string;
  variantId: string;
  createdAt: string;
  variant?: {
    id: string;
    sku: string;
    price: number;
    salePrice?: number;
    product: {
      id: string;
      name: string;
      slug: string;
      media: { url: string; altText?: string }[];
    };
  };
}
