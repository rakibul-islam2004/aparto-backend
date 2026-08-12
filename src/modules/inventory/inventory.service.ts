import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateWarehouseDto, UpdateWarehouseDto, UpdateInventoryDto, CreateInventoryMovementDto, WarehouseResponseDto, InventoryResponseDto } from "../dto/inventory.dto";
import { MovementType } from "@prisma/client";

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async createWarehouse(dto: CreateWarehouseDto): Promise<WarehouseResponseDto> {
    const existing = await this.prisma.warehouse.findFirst({ where: { OR: [{ code: dto.code }, { name: dto.name }] } });
    if (existing) throw new ConflictException("Warehouse with same name or code already exists");

    const warehouse = await this.prisma.warehouse.create({
      data: { name: dto.name, code: dto.code, address: dto.address, isActive: dto.isActive ?? true },
    });
    return this.mapWarehouseToResponse(warehouse);
  }

  async findAllWarehouses(): Promise<WarehouseResponseDto[]> {
    const warehouses = await this.prisma.warehouse.findMany({ orderBy: { name: "asc" } });
    return warehouses.map(this.mapWarehouseToResponse);
  }

  async findWarehouse(id: string): Promise<WarehouseResponseDto> {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) throw new NotFoundException("Warehouse not found");
    return this.mapWarehouseToResponse(warehouse);
  }

  async updateWarehouse(id: string, dto: UpdateWarehouseDto): Promise<WarehouseResponseDto> {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) throw new NotFoundException("Warehouse not found");

    if (dto.code && dto.code !== warehouse.code) {
      const existing = await this.prisma.warehouse.findUnique({ where: { code: dto.code } });
      if (existing) throw new ConflictException("Warehouse code already exists");
    }

    const updated = await this.prisma.warehouse.update({ where: { id }, data: dto });
    return this.mapWarehouseToResponse(updated);
  }

  async deleteWarehouse(id: string): Promise<void> {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) throw new NotFoundException("Warehouse not found");
    await this.prisma.warehouse.delete({ where: { id } });
  }

  async getInventory(variantId: string) {
    return this.prisma.inventory.findMany({
      where: { variantId },
      include: { warehouse: true },
    });
  }

  async updateInventory(inventoryId: string, dto: UpdateInventoryDto) {
    const inventory = await this.prisma.inventory.findUnique({ where: { id: inventoryId } });
    if (!inventory) throw new NotFoundException("Inventory not found");

    const updated = await this.prisma.inventory.update({
      where: { id: inventoryId },
      data: {
        onHand: dto.onHand ?? inventory.onHand,
        reserved: dto.reserved ?? inventory.reserved,
        reorderLevel: dto.reorderLevel ?? inventory.reorderLevel,
        available: (dto.onHand ?? inventory.onHand) - (dto.reserved ?? inventory.reserved),
      },
      include: { warehouse: true, variant: true },
    });
    return updated;
  }

  async createMovement(dto: CreateInventoryMovementDto) {
    const inventory = await this.prisma.inventory.findUnique({ where: { id: dto.inventoryId } });
    if (!inventory) throw new NotFoundException("Inventory not found");

    const delta = dto.type === MovementType.RECEIPT || dto.type === MovementType.ADJUSTMENT ? dto.quantity : -dto.quantity;
    const newOnHand = Math.max(0, inventory.onHand + delta);

    const [movement, updated] = await this.prisma.$transaction([
      this.prisma.inventoryMovement.create({
        data: { inventoryId: dto.inventoryId, type: dto.type, quantity: dto.quantity, reason: dto.reason, reference: dto.reference },
      }),
      this.prisma.inventory.update({
        where: { id: dto.inventoryId },
        data: { onHand: newOnHand, available: newOnHand - inventory.reserved },
        include: { warehouse: true, variant: true },
      }),
    ]);

    return { movement, inventory: updated };
  }

  async getMovements(inventoryId: string) {
    return this.prisma.inventoryMovement.findMany({
      where: { inventoryId },
      orderBy: { createdAt: "desc" },
    });
  }

  private mapWarehouseToResponse(warehouse: any): WarehouseResponseDto {
    return {
      id: warehouse.id,
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address,
      isActive: warehouse.isActive,
      createdAt: warehouse.createdAt,
      updatedAt: warehouse.updatedAt,
    };
  }
}
