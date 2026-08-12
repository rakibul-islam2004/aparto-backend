import { Controller, Post, Body, Get, Param, UseGuards } from "@nestjs/common";
import { CourierService } from "./courier.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("shipments")
export class CourierController {
  constructor(private readonly courierService: CourierService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createShipment(
    @Body() dto: { orderId: string; courierCode: string; warehouseId?: string },
  ) {
    return this.courierService.createShipment(dto);
  }

  @Get(":consignmentId/tracking")
  async getTracking(@Param("consignmentId") consignmentId: string) {
    return this.courierService.getTracking(consignmentId);
  }
}
