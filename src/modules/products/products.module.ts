import { Module } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { ProductsController } from "./products.controller";
import { DatabaseModule } from "../../database/database.module";
import { BarcodesModule } from "../barcodes/barcodes.module";

@Module({
  imports: [DatabaseModule, BarcodesModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
