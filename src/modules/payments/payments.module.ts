import { Module } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { PaymentsController } from "./payments.controller";
import { SSLCommerzProvider } from "./sslcommerz.provider";
import { ShurjoPayProvider } from "./shurjopay.provider";
import { CashOnDeliveryProvider } from "./cod.provider";
import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    SSLCommerzProvider,
    ShurjoPayProvider,
    CashOnDeliveryProvider,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
