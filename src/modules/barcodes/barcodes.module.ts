import { Module } from "@nestjs/common";
import { BarcodesService } from "./barcodes.service";
import { BarcodesController } from "./barcodes.controller";
import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [BarcodesController],
  providers: [BarcodesService],
  exports: [BarcodesService],
})
export class BarcodesModule {}
