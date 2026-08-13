import { Controller, Get, UseGuards, Query } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("dashboard")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN", "SUPER_ADMIN")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("stats")
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get("recent-orders")
  async getRecentOrders(@Query("limit") limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.dashboardService.getRecentOrders(limitNum);
  }

  @Get("low-stock")
  async getLowStock(@Query("threshold") threshold?: string) {
    const thresholdNum = threshold ? parseInt(threshold, 10) : 10;
    return this.dashboardService.getLowStock(thresholdNum);
  }
}
