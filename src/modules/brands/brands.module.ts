import { Module } from "@nestjs/common";
import { BrandsService } from "./brands.service";
import { BrandsController } from "./brands.controller";
import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [BrandsController],
  providers: [BrandsService],
  exports: [BrandsService],
})
export class BrandsModule {}
