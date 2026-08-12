import { IsString, IsOptional, IsInt, Min } from "class-validator";

export class AddCartItemDto {
  @IsString()
  variantId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class UpdateCartItemDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class CartResponseDto {
  id: string;
  userId?: string;
  sessionId?: string;
  items: CartItemResponseDto[];
  createdAt: string;
  updatedAt: string;
}

export class CartItemResponseDto {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
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
