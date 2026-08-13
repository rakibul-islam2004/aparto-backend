import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [
      totalOrders,
      totalRevenue,
      totalCustomers,
      totalProducts,
      pendingOrders,
      lowStockCount,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        _sum: { total: true },
        where: { paymentStatus: "PAID" },
      }),
      this.prisma.user.count({ where: { role: "CUSTOMER" } }),
      this.prisma.product.count(),
      this.prisma.order.count({ where: { status: "PENDING_PAYMENT" } }),
      this.prisma.inventory.count({ where: { available: { lte: 10 } } }),
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      totalCustomers,
      totalProducts,
      pendingOrders,
      lowStockCount,
    };
  }

  async getRecentOrders(limit: number = 10) {
    return this.prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: { id: true, name: true, slug: true },
                },
              },
            },
          },
        },
      },
    });
  }

  async getLowStock(threshold: number = 10) {
    return this.prisma.inventory.findMany({
      where: { available: { lte: threshold } },
      include: {
        variant: {
          include: {
            product: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        warehouse: {
          select: { id: true, name: true },
        },
      },
      orderBy: { available: "asc" },
    });
  }
}
