import { IsNumber, IsOptional, IsString } from "class-validator";
import { MovementType } from "@prisma/client";

export class CreateWarehouseDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsString()
  address: string;

  @IsOptional()
  isActive?: boolean;
}

export class UpdateWarehouseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  isActive?: boolean;
}

export class UpdateInventoryDto {
  @IsOptional()
  @IsNumber()
  onHand?: number;

  @IsOptional()
  @IsNumber()
  reserved?: number;

  @IsOptional()
  @IsNumber()
  reorderLevel?: number;
}

export class CreateInventoryMovementDto {
  @IsString()
  inventoryId: string;

  @IsEnum(MovementType)
  type: MovementType;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  reference?: string;
}

import { IsEnum } from "class-validator";

export class WarehouseResponseDto {
  id: string;
  name: string;
  code: string;
  address: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class InventoryResponseDto {
  id: string;
  variantId: string;
  warehouseId: string;
  onHand: number;
  reserved: number;
  available: number;
  reorderLevel: number;
  createdAt: Date;
  updatedAt: Date;
}
