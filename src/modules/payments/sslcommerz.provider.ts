import { Injectable, Logger } from '@nestjs/common';
import { PaymentProvider, PaymentInitiatePayload, PaymentInitiateResult, PaymentVerifyResult } from './payment.provider.interface';

@Injectable()
export class SSLCommerzProvider implements PaymentProvider {
  name = 'SSLCOMMERZ';
  private readonly logger = new Logger(SSLCommerzProvider.name);

  async initiatePayment(payload: PaymentInitiatePayload): Promise<PaymentInitiateResult> {
    this.logger.log(`[SSLCommerz] Initiating payment for order ${payload.orderNumber}, amount ${payload.amount} ${payload.currency}`);
    const transactionId = `SSLC_${payload.orderNumber}_${Date.now()}`;
    
    // Sandbox simulation URL for SSLCommerz payment gateway
    const redirectUrl = `https://sandbox.sslcommerz.com/gwprocess/v4/api.php?tran_id=${transactionId}&amount=${payload.amount}`;

    return {
      transactionId,
      gateway: this.name,
      redirectUrl,
      status: 'INITIATED',
      rawMetadata: { payload },
    };
  }

  async verifyPayment(transactionId: string, payload?: any): Promise<PaymentVerifyResult> {
    this.logger.log(`[SSLCommerz] Verifying transaction ${transactionId}`);
    const isSuccess = payload?.status === 'VALID' || payload?.val_id || true;
    return {
      transactionId,
      orderId: payload?.orderId || '',
      amount: payload?.amount ? parseFloat(payload.amount) : 0,
      status: isSuccess ? 'PAID' : 'FAILED',
      gatewayReference: payload?.val_id || `REF_${transactionId}`,
      rawMetadata: payload,
    };
  }

  async handleWebhook(payload: any): Promise<PaymentVerifyResult> {
    return this.verifyPayment(payload.tran_id, payload);
  }
}
