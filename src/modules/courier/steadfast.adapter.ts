import { Injectable, Logger } from '@nestjs/common';
import { CourierProviderAdapter, CreateShipmentPayload, CreateShipmentResult, TrackingResult } from './courier.provider.interface';

@Injectable()
export class SteadfastAdapter implements CourierProviderAdapter {
  code = 'STEADFAST';
  name = 'Steadfast Courier Bangladesh';
  private readonly logger = new Logger(SteadfastAdapter.name);

  async createShipment(payload: CreateShipmentPayload): Promise<CreateShipmentResult> {
    this.logger.log(`[Steadfast] Creating consignment for order ${payload.orderNumber} to ${payload.recipientAddress}`);
    
    // Generate Steadfast Consignment Reference Format
    const consignmentId = `SF_${payload.orderNumber}_${Date.now().toString().slice(-4)}`;
    const trackingNumber = `SF-TRACK-${payload.orderNumber}`;

    return {
      consignmentId,
      trackingNumber,
      status: 'PROCESSING',
      deliveryCharge: 60, // Standard Dhaka city rate
      rawMetadata: { payload, provider: this.name },
    };
  }

  async getTracking(consignmentId: string): Promise<TrackingResult> {
    return {
      consignmentId,
      currentStatus: 'IN_TRANSIT',
      events: [
        { status: 'CREATED', location: 'Dhaka Hub', time: new Date(Date.now() - 3600000).toISOString() },
        { status: 'IN_TRANSIT', location: 'Mirpur Sorting Center', time: new Date().toISOString() },
      ],
    };
  }

  async cancelShipment(consignmentId: string): Promise<boolean> {
    this.logger.log(`[Steadfast] Cancelling consignment ${consignmentId}`);
    return true;
  }
}
