import { IsString, IsOptional, IsBoolean, IsEnum, IsDecimal, IsInt, Min, Max } from "class-validator";
import { OrderStatus, PaymentStatus } from "@prisma/client";

export class CreateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  shippingAddress: Record<string, any>;

  @IsOptional()
  billingAddress: Record<string, any>;

  @IsOptional()
  @IsDecimal()
  @Min(0)
  shipping?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsDecimal()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsDecimal()
  @Min(0)
  shipping?: number;

  @IsOptional()
  @IsDecimal()
  @Min(0)
  tax?: number;

  @IsOptional()
  shippingAddress?: Record<string, any>;

  @IsOptional()
  billingAddress?: Record<string, any>;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class OrderResponseDto {
  id: string;
  orderNumber: string;
  customerId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  couponCode?: string;
  shippingAddress: Record<string, any>;
  billingAddress: Record<string, any>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItemResponseDto[];
}

export class OrderItemResponseDto {
  id: string;
  orderId: string;
  variantId: string;
  quantity: number;
  price: number;
  total: number;
  variant?: {
    id: string;
    sku: string;
    barcode?: string;
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
