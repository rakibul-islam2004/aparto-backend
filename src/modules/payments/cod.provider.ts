import { Injectable, Logger } from '@nestjs/common';
import { PaymentProvider, PaymentInitiatePayload, PaymentInitiateResult, PaymentVerifyResult } from './payment.provider.interface';

@Injectable()
export class CashOnDeliveryProvider implements PaymentProvider {
  name = 'CASH_ON_DELIVERY';
  private readonly logger = new Logger(CashOnDeliveryProvider.name);

  async initiatePayment(payload: PaymentInitiatePayload): Promise<PaymentInitiateResult> {
    this.logger.log(`[COD] Order ${payload.orderNumber} set for Cash on Delivery (Amount: ${payload.amount} BDT)`);
    const transactionId = `COD_${payload.orderNumber}_${Date.now()}`;
    return {
      transactionId,
      gateway: this.name,
      status: 'PENDING',
      rawMetadata: { payload },
    };
  }

  async verifyPayment(transactionId: string, payload?: any): Promise<PaymentVerifyResult> {
    return {
      transactionId,
      orderId: payload?.orderId || '',
      amount: payload?.amount || 0,
      status: 'PAID',
      rawMetadata: payload,
    };
  }

  async handleWebhook(payload: any): Promise<PaymentVerifyResult> {
    return this.verifyPayment(payload.transactionId, payload);
  }
}
