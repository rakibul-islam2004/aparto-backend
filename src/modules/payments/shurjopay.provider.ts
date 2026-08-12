import { Injectable, Logger } from '@nestjs/common';
import { PaymentProvider, PaymentInitiatePayload, PaymentInitiateResult, PaymentVerifyResult } from './payment.provider.interface';

@Injectable()
export class ShurjoPayProvider implements PaymentProvider {
  name = 'SHURJOPAY';
  private readonly logger = new Logger(ShurjoPayProvider.name);

  async initiatePayment(payload: PaymentInitiatePayload): Promise<PaymentInitiateResult> {
    this.logger.log(`[ShurjoPay] Initiating payment for order ${payload.orderNumber}, amount ${payload.amount}`);
    const transactionId = `SP_${payload.orderNumber}_${Date.now()}`;
    const redirectUrl = `https://sandbox.shurjopay.com/pay/${transactionId}`;

    return {
      transactionId,
      gateway: this.name,
      redirectUrl,
      status: 'INITIATED',
      rawMetadata: { payload },
    };
  }

  async verifyPayment(transactionId: string, payload?: any): Promise<PaymentVerifyResult> {
    this.logger.log(`[ShurjoPay] Verifying transaction ${transactionId}`);
    return {
      transactionId,
      orderId: payload?.orderId || '',
      amount: payload?.amount ? parseFloat(payload.amount) : 0,
      status: 'PAID',
      gatewayReference: payload?.bank_tx_id || `SP_REF_${transactionId}`,
      rawMetadata: payload,
    };
  }

  async handleWebhook(payload: any): Promise<PaymentVerifyResult> {
    return this.verifyPayment(payload.sp_order_id, payload);
  }
}
