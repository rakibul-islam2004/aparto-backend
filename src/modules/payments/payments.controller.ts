import { Controller, Post, Body, Param, UseGuards } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("initiate")
  @UseGuards(JwtAuthGuard)
  async initiatePayment(
    @Body()
    dto: {
      orderId: string;
      gateway: string;
      isPartial?: boolean;
      partialAmount?: number;
    },
  ) {
    return this.paymentsService.initiatePayment(dto);
  }

  @Post("due-collection")
  @UseGuards(JwtAuthGuard)
  async recordDuePayment(
    @Body()
    dto: {
      orderId: string;
      amount: number;
      paymentMethod: string;
      reference?: string;
    },
  ) {
    return this.paymentsService.recordDuePayment(dto);
  }

  @Post("webhook/:gateway")
  async handleWebhook(@Param("gateway") gateway: string, @Body() payload: any) {
    return this.paymentsService.handleWebhook(gateway, payload);
  }
}
