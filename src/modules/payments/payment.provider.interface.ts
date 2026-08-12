export interface PaymentInitiatePayload {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  callbackUrl: string;
}

export interface PaymentInitiateResult {
  transactionId: string;
  gateway: string;
  redirectUrl?: string;
  status: 'INITIATED' | 'PENDING' | 'PAID' | 'FAILED';
  rawMetadata?: any;
}

export interface PaymentVerifyResult {
  transactionId: string;
  orderId: string;
  amount: number;
  status: 'PAID' | 'FAILED' | 'CANCELLED';
  gatewayReference?: string;
  rawMetadata?: any;
}

export interface PaymentProvider {
  name: string;
  initiatePayment(payload: PaymentInitiatePayload): Promise<PaymentInitiateResult>;
  verifyPayment(transactionId: string, payload?: any): Promise<PaymentVerifyResult>;
  handleWebhook(payload: any, signature?: string): Promise<PaymentVerifyResult>;
}
