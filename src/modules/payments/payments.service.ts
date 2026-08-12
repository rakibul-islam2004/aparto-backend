import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SSLCommerzProvider } from './sslcommerz.provider';
import { ShurjoPayProvider } from './shurjopay.provider';
import { CashOnDeliveryProvider } from './cod.provider';
import { PaymentProvider } from './payment.provider.interface';

@Injectable()
export class PaymentsService {
  private providers: Map<string, PaymentProvider> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly sslCommerz: SSLCommerzProvider,
    private readonly shurjoPay: ShurjoPayProvider,
    private readonly cod: CashOnDeliveryProvider,
  ) {
    this.providers.set('SSLCOMMERZ', this.sslCommerz);
    this.providers.set('SHURJOPAY', this.shurjoPay);
    this.providers.set('CASH_ON_DELIVERY', this.cod);
  }

  async initiatePayment(dto: {
    orderId: string;
    gateway: string;
    isPartial?: boolean;
    partialAmount?: number;
  }) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { customer: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${dto.orderId} not found`);
    }

    const provider = this.providers.get(dto.gateway.toUpperCase());
    if (!provider) {
      throw new BadRequestException(`Unsupported payment gateway: ${dto.gateway}`);
    }

    const payableAmount = dto.isPartial && dto.partialAmount ? dto.partialAmount : Number(order.dueAmount || order.total);

    const result = await provider.initiatePayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: payableAmount,
      currency: 'BDT',
      customerName: order.customer.name || 'Customer',
      customerEmail: order.customer.email,
      customerPhone: order.customer.phone || '',
      callbackUrl: `${process.env.APP_URL || 'http://localhost:3000'}/api/payments/callback/${dto.gateway.toLowerCase()}`,
    });

    // Record Payment Transaction
    const paymentRecord = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        transactionId: result.transactionId,
        gateway: dto.gateway as any,
        amount: payableAmount,
        currency: 'BDT',
        status: result.status === 'PAID' ? 'PAID' : 'INITIATED',
        metadata: result.rawMetadata,
      },
    });

    return {
      payment: paymentRecord,
      redirectUrl: result.redirectUrl,
    };
  }

  async recordDuePayment(dto: { orderId: string; amount: number; paymentMethod: string; reference?: string }) {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const currentDue = Number(order.dueAmount);
    if (dto.amount > currentDue) {
      throw new BadRequestException(`Amount ${dto.amount} exceeds outstanding due balance of ${currentDue}`);
    }

    const newPaidAmount = Number(order.paidAmount) + dto.amount;
    const newDueAmount = currentDue - dto.amount;
    const isFullyPaid = newDueAmount <= 0;

    const transactionId = `DUE_${order.orderNumber}_${Date.now()}`;

    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        transactionId,
        gateway: 'MANUAL',
        amount: dto.amount,
        status: 'PAID',
        reference: dto.reference || 'Manual Due Collection',
      },
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount,
        paymentStatus: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID',
      },
    });

    return {
      payment,
      remainingDue: newDueAmount,
      paymentStatus: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID',
    };
  }

  async handleWebhook(gateway: string, payload: any) {
    const provider = this.providers.get(gateway.toUpperCase());
    if (!provider) throw new BadRequestException(`Gateway ${gateway} not supported`);

    const verifyResult = await provider.handleWebhook(payload);

    if (verifyResult.status === 'PAID') {
      const payment = await this.prisma.payment.findUnique({
        where: { transactionId: verifyResult.transactionId },
      });

      if (payment) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'PAID', reference: verifyResult.gatewayReference },
        });

        const order = await this.prisma.order.findUnique({ where: { id: payment.orderId } });
        if (order) {
          const newPaid = Number(order.paidAmount) + Number(payment.amount);
          const newDue = Math.max(0, Number(order.total) - newPaid);
          await this.prisma.order.update({
            where: { id: order.id },
            data: {
              paidAmount: newPaid,
              dueAmount: newDue,
              paymentStatus: newDue <= 0 ? 'PAID' : 'PARTIALLY_PAID',
              status: 'CONFIRMED',
            },
          });
        }
      }
    }

    return { success: true, verifyResult };
  }
}
