export interface CreateShipmentPayload {
  orderId: string;
  orderNumber: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity: string;
  recipientArea?: string;
  codAmount: number;
  packageWeight?: number;
  itemDescription?: string;
}

export interface CreateShipmentResult {
  consignmentId: string;
  trackingNumber: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED';
  deliveryCharge?: number;
  rawMetadata?: any;
}

export interface TrackingResult {
  consignmentId: string;
  trackingNumber?: string;
  currentStatus: string;
  events: Array<{ status: string; location?: string; time: string }>;
}

export interface CourierProviderAdapter {
  code: string;
  name: string;
  createShipment(payload: CreateShipmentPayload): Promise<CreateShipmentResult>;
  getTracking(consignmentId: string): Promise<TrackingResult>;
  cancelShipment(consignmentId: string): Promise<boolean>;
}
