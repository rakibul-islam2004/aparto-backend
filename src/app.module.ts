import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BarcodesModule } from "./modules/barcodes/barcodes.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { CourierModule } from "./modules/courier/courier.module";
import { CmsModule } from "./modules/cms/cms.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    DatabaseModule,
    AuthModule,
    BarcodesModule,
    PaymentsModule,
    CourierModule,
    CmsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
