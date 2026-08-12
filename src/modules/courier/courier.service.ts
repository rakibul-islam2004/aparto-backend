import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SteadfastAdapter } from './steadfast.adapter';
import { PathaoAdapter } from './pathao.adapter';
import { CourierProviderAdapter } from './courier.provider.interface';

@Injectable()
export class CourierService {
  private adapters: Map<string, CourierProviderAdapter> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly steadfast: SteadfastAdapter,
    private readonly pathao: PathaoAdapter,
  ) {
    this.adapters.set('STEADFAST', this.steadfast);
    this.adapters.set('PATHAO', this.pathao);
  }

  async createShipment(dto: { orderId: string; courierCode: string; warehouseId?: string }) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { customer: true },
    });

    if (!order) throw new NotFoundException('Order not found');

    const adapter = this.adapters.get(dto.courierCode.toUpperCase());
    if (!adapter) throw new BadRequestException(`Courier provider ${dto.courierCode} not supported`);

    const shippingAddr: any = order.shippingAddress;
    const warehouse = await this.prisma.warehouse.findFirst({ where: { isActive: true } });

    const result = await adapter.createShipment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      recipientName: shippingAddr?.fullName || order.customer.name || 'Recipient',
      recipientPhone: shippingAddr?.phone || order.customer.phone || '',
      recipientAddress: shippingAddr?.addressLine || 'Address',
      recipientCity: shippingAddr?.city || 'Dhaka',
      recipientArea: shippingAddr?.area || '',
      codAmount: Number(order.dueAmount || 0),
    });

    // Get or create Courier Provider record
    let providerRecord = await this.prisma.courierProvider.findUnique({
      where: { code: dto.courierCode.toUpperCase() },
    });

    if (!providerRecord) {
      providerRecord = await this.prisma.courierProvider.create({
        data: {
          name: adapter.name,
          code: dto.courierCode.toUpperCase(),
          apiKey: 'mock-key',
          apiSecret: 'mock-secret',
          isSandbox: true,
        },
      });
    }

    const shipment = await this.prisma.shipment.create({
      data: {
        orderId: order.id,
        courierId: providerRecord.id,
        warehouseId: dto.warehouseId || warehouse?.id || 'default-wh',
        consignmentId: result.consignmentId,
        trackingNumber: result.trackingNumber,
        status: 'PROCESSING',
        codAmount: order.dueAmount,
        metadata: result.rawMetadata,
      },
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: { status: 'SHIPPED' },
    });

    return shipment;
  }

  async getTracking(consignmentId: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { consignmentId },
      include: { courier: true },
    });

    if (!shipment) throw new NotFoundException('Shipment not found');

    const adapter = this.adapters.get(shipment.courier.code);
    if (!adapter) return shipment;

    return adapter.getTracking(consignmentId);
  }
}
