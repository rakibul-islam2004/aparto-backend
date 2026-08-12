import {
  IsString,
  IsOptional,
  IsUrl,
  MaxLength,
  IsPhoneNumber,
  IsDateString,
  IsEnum,
} from "class-validator";
import { AddressType } from "@prisma/client";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsPhoneNumber("BD")
  phone?: string;

  @IsOptional()
  @IsUrl()
  avatar?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  preferences?: Record<string, any>;
}

export class CreateAddressDto {
  @IsEnum(AddressType)
  type: AddressType;

  @IsString()
  @MaxLength(100)
  fullName: string;

  @IsString()
  @MaxLength(20)
  phone: string;

  @IsString()
  @MaxLength(500)
  addressLine: string;

  @IsString()
  @MaxLength(100)
  area: string;

  @IsString()
  @MaxLength(100)
  city: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  postalCode?: string;

  @IsOptional()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @IsOptional()
  type?: AddressType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  addressLine?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  area?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  postalCode?: string;

  @IsOptional()
  isDefault?: boolean;
}

export class AddressResponseDto {
  id: string;
  userId: string;
  type: AddressType;
  fullName: string;
  phone: string;
  addressLine: string;
  area: string;
  city: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

