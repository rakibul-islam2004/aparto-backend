import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { CreateOrderDto, UpdateOrderDto } from "./dto/order.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  createOrder(@CurrentUser("id") customerId: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(customerId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getOrders(@CurrentUser("id") customerId: string, @Query() query: any) {
    return this.ordersService.findAll(customerId, {
      status: query.status,
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
    });
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  getOrder(@CurrentUser("id") customerId: string, @Param("id") id: string) {
    return this.ordersService.findOne(id, customerId);
  }

  @Get("number/:orderNumber")
  @UseGuards(JwtAuthGuard)
  getOrderByNumber(@CurrentUser("id") customerId: string, @Param("orderNumber") orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber, customerId);
  }

  @Get("track/:orderNumber")
  async trackOrder(@Param("orderNumber") orderNumber: string) {
    return this.ordersService.findByOrderNumberPublic(orderNumber);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  updateOrder(@CurrentUser("id") customerId: string, @Param("id") id: string, @Body() dto: UpdateOrderDto) {
    return this.ordersService.update(id, customerId, dto);
  }

  @Patch(":id/cancel")
  @UseGuards(JwtAuthGuard)
  cancelOrder(@CurrentUser("id") customerId: string, @Param("id") id: string) {
    return this.ordersService.cancel(id, customerId);
  }
}
