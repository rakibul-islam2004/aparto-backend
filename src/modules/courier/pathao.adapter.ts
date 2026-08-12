import { Injectable, Logger } from '@nestjs/common';
import { CourierProviderAdapter, CreateShipmentPayload, CreateShipmentResult, TrackingResult } from './courier.provider.interface';

@Injectable()
export class PathaoAdapter implements CourierProviderAdapter {
  code = 'PATHAO';
  name = 'Pathao Courier Bangladesh';
  private readonly logger = new Logger(PathaoAdapter.name);

  async createShipment(payload: CreateShipmentPayload): Promise<CreateShipmentResult> {
    this.logger.log(`[Pathao] Creating parcel delivery for order ${payload.orderNumber}`);
    const consignmentId = `PTH_${payload.orderNumber}_${Date.now().toString().slice(-4)}`;
    const trackingNumber = `PTH-TRACK-${payload.orderNumber}`;

    return {
      consignmentId,
      trackingNumber,
      status: 'PROCESSING',
      deliveryCharge: 70,
      rawMetadata: { payload, provider: this.name },
    };
  }

  async getTracking(consignmentId: string): Promise<TrackingResult> {
    return {
      consignmentId,
      currentStatus: 'OUT_FOR_DELIVERY',
      events: [
        { status: 'PICKED_UP', location: 'Dhaka Central Depot', time: new Date(Date.now() - 7200000).toISOString() },
        { status: 'OUT_FOR_DELIVERY', location: 'Dhaka Zone Agent', time: new Date().toISOString() },
      ],
    };
  }

  async cancelShipment(consignmentId: string): Promise<boolean> {
    this.logger.log(`[Pathao] Cancelling consignment ${consignmentId}`);
    return true;
  }
}
