import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from "@nestjs/common";
import { InventoryService } from "./inventory.service";
import { CreateWarehouseDto, UpdateWarehouseDto, UpdateInventoryDto, CreateInventoryMovementDto } from "./dto/inventory.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("inventory")
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post("warehouses")
  @UseGuards(JwtAuthGuard)
  createWarehouse(@Body() dto: CreateWarehouseDto) {
    return this.inventoryService.createWarehouse(dto);
  }

  @Get("warehouses")
  findAllWarehouses() {
    return this.inventoryService.findAllWarehouses();
  }

  @Get("warehouses/:id")
  findWarehouse(@Param("id") id: string) {
    return this.inventoryService.findWarehouse(id);
  }

  @Patch("warehouses/:id")
  @UseGuards(JwtAuthGuard)
  updateWarehouse(@Param("id") id: string, @Body() dto: UpdateWarehouseDto) {
    return this.inventoryService.updateWarehouse(id, dto);
  }

  @Delete("warehouses/:id")
  @UseGuards(JwtAuthGuard)
  deleteWarehouse(@Param("id") id: string) {
    return this.inventoryService.deleteWarehouse(id);
  }

  @Get("variants/:variantId")
  getInventory(@Param("variantId") variantId: string) {
    return this.inventoryService.getInventory(variantId);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  updateInventory(@Param("id") id: string, @Body() dto: UpdateInventoryDto) {
    return this.inventoryService.updateInventory(id, dto);
  }

  @Post("movements")
  @UseGuards(JwtAuthGuard)
  createMovement(@Body() dto: CreateInventoryMovementDto) {
    return this.inventoryService.createMovement(dto);
  }

  @Get("movements/:inventoryId")
  getMovements(@Param("inventoryId") inventoryId: string) {
    return this.inventoryService.getMovements(inventoryId);
  }
}
