import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { UpdateProfileDto, CreateAddressDto, UpdateAddressDto, AddressResponseDto } from "./dto/user.dto";
import { RoomType } from "@prisma/client";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        emailVerified: true,
        phoneVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        profile: true,
      },
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        phone: dto.phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        emailVerified: true,
        phoneVerified: true,
      },
    });

    if (dto.avatar || dto.dateOfBirth || dto.preferences) {
      await this.prisma.customerProfile.upsert({
        where: { userId },
        update: {
          avatar: dto.avatar,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          preferences: dto.preferences,
        },
        create: {
          userId,
          avatar: dto.avatar,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          preferences: dto.preferences,
        },
      });
    }

    return updated;
  }

  async createAddress(userId: string, dto: CreateAddressDto): Promise<AddressResponseDto> {
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await this.prisma.address.create({
      data: {
        userId,
        type: dto.type,
        fullName: dto.fullName,
        phone: dto.phone,
        addressLine: dto.addressLine,
        area: dto.area,
        city: dto.city,
        postalCode: dto.postalCode,
        isDefault: dto.isDefault ?? false,
      },
    });
    return this.mapToResponse(address);
  }

  async getAddresses(userId: string): Promise<AddressResponseDto[]> {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: "desc" },
    });
    return addresses.map(this.mapToResponse);
  }

  async getAddress(userId: string, addressId: string): Promise<AddressResponseDto> {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) throw new NotFoundException("Address not found");
    return this.mapToResponse(address);
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto): Promise<AddressResponseDto> {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) throw new NotFoundException("Address not found");

    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.address.update({
      where: { id: addressId },
      data: dto,
    });
    return this.mapToResponse(updated);
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) throw new NotFoundException("Address not found");
    await this.prisma.address.delete({ where: { id: addressId } });
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  private mapToResponse(address: any): AddressResponseDto {
    return {
      id: address.id,
      userId: address.userId,
      type: address.type,
      fullName: address.fullName,
      phone: address.phone,
      addressLine: address.addressLine,
      area: address.area,
      city: address.city,
      postalCode: address.postalCode,
      isDefault: address.isDefault,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };
  }
}
