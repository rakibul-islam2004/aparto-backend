import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateOrderDto, UpdateOrderDto, OrderResponseDto, OrderItemResponseDto } from "./dto/order.dto";

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(customerId: string, dto: CreateOrderDto): Promise<OrderResponseDto> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId: customerId },
      include: { items: { include: { variant: { include: { inventory: { include: { warehouse: true } } } } } } },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException("Cart is empty");
    }

    // Validate stock availability
    for (const item of cart.items) {
      const inventory = item.variant?.inventory?.[0];
      const availableStock = inventory?.available ?? 0;
      if (availableStock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${item.variant?.product?.name || 'product'}. Available: ${availableStock}, Requested: ${item.quantity}`
        );
      }
    }

    const subtotal = cart.items.reduce((sum, item) => sum + Number(item.variant.price) * item.quantity, 0);
    const shipping = dto.shipping ?? 0;
    const tax = 0;
    const discount = 0;
    const total = subtotal + shipping + tax - discount;

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          status: dto.status || "PENDING_PAYMENT",
          paymentStatus: dto.paymentStatus || "PENDING",
          subtotal,
          discount,
          shipping,
          tax,
          total,
          paidAmount: 0,
          dueAmount: total,
          couponCode: dto.couponCode,
          shippingAddress: dto.shippingAddress,
          billingAddress: dto.billingAddress,
          notes: dto.notes,
          items: {
            create: cart.items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              price: Number(item.variant.price),
              total: Number(item.variant.price) * item.quantity,
            })),
          },
        },
        include: { items: true },
      });

      // Reserve stock
      for (const item of cart.items) {
        const inventory = item.variant?.inventory?.[0];
        if (inventory) {
          await tx.inventory.update({
            where: { id: inventory.id },
            data: {
              reserved: { increment: item.quantity },
              available: { decrement: item.quantity },
            },
          });

          await tx.inventoryMovement.create({
            data: {
              inventoryId: inventory.id,
              type: "SHIPMENT",
              quantity: item.quantity,
              reason: "Order reservation",
              reference: order.orderNumber,
            },
          });
        }
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return created;
    });

    return this.mapToResponse(order);
  }

  async findAll(customerId: string, filters?: { status?: string; page?: number; limit?: number }) {
    const where: any = { customerId };
    if (filters?.status) where.status = filters.status as any;

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: { include: { variant: { include: { product: { include: { media: { where: { isPrimary: true } } } } } } } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map((o) => this.mapToResponse(o)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, customerId: string): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: { id, customerId },
      include: { items: { include: { variant: { include: { product: { include: { media: { where: { isPrimary: true } } } } } } } } },
    });

    if (!order) throw new NotFoundException("Order not found");
    return this.mapToResponse(order);
  }

  async findByOrderNumber(orderNumber: string, customerId: string): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findFirst({
      where: { orderNumber, customerId },
      include: { items: { include: { variant: { include: { product: { include: { media: { where: { isPrimary: true } } } } } } } } },
    });

    if (!order) throw new NotFoundException("Order not found");
    return this.mapToResponse(order);
  }

  async update(id: string, customerId: string, dto: UpdateOrderDto): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findFirst({ where: { id, customerId } });
    if (!order) throw new NotFoundException("Order not found");

    if (order.status === "DELIVERED" || order.status === "CANCELLED") {
      throw new BadRequestException(`Cannot update order in ${order.status} status`);
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        paymentStatus: dto.paymentStatus,
        couponCode: dto.couponCode,
        discount: dto.discount,
        shipping: dto.shipping,
        tax: dto.tax,
        shippingAddress: dto.shippingAddress,
        billingAddress: dto.billingAddress,
        notes: dto.notes,
      },
      include: { items: true },
    });

    return this.mapToResponse(updated);
  }

  async cancel(id: string, customerId: string): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findFirst({ where: { id, customerId } });
    if (!order) throw new NotFoundException("Order not found");

    if (order.status === "DELIVERED" || order.status === "CANCELLED") {
      throw new BadRequestException(`Cannot cancel order in ${order.status} status`);
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: { items: true },
    });

    return this.mapToResponse(updated);
  }

  private mapToResponse(order: any): OrderResponseDto {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      shipping: Number(order.shipping),
      tax: Number(order.tax),
      total: Number(order.total),
      paidAmount: Number(order.paidAmount),
      dueAmount: Number(order.dueAmount),
      couponCode: order.couponCode,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items?.map((item: any) => this.mapItemToResponse(item)),
    };
  }

  private mapItemToResponse(item: any): OrderItemResponseDto {
    const variant = item.variant;
    const product = variant?.product;
    const primaryMedia = product?.media?.find((m: any) => m.isPrimary);

    return {
      id: item.id,
      orderId: item.orderId,
      variantId: item.variantId,
      quantity: item.quantity,
      price: Number(item.price),
      total: Number(item.total),
      variant: variant
        ? {
            id: variant.id,
            sku: variant.sku,
            barcode: variant.barcode,
            price: Number(variant.price),
            salePrice: variant.salePrice ? Number(variant.salePrice) : undefined,
            product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
              media: primaryMedia ? [{ url: primaryMedia.url, altText: primaryMedia.altText }] : [],
            },
          }
        : undefined,
    };
  }
}
