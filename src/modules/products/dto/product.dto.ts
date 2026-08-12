import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  MaxLength,
  Min,
} from "class-validator";
import { ProductStatus } from "@prisma/client";

export class CreateProductDto {
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsString()
  categoryId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roomTypes?: string[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roomTypes?: string[];
}

import { IsEnum } from "class-validator";

export class CreateVariantDto {
  @IsString()
  sku: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  attributes?: Record<string, any>;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @IsNumber()
  @Min(0)
  cost: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  isActive?: boolean;
}

export class UpdateVariantDto {
  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  attributes?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  isActive?: boolean;
}

export class ProductResponseDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  brandId?: string;
  categoryId: string;
  tags: string[];
  status: ProductStatus;
  roomTypes: string[];
  createdAt: Date;
  updatedAt: Date;
  variants?: any[];
  media?: any[];
}

export class VariantResponseDto {
  id: string;
  productId: string;
  sku: string;
  barcode?: string;
  attributes: Record<string, any>;
  price: number;
  salePrice?: number;
  cost: number;
  weight?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
