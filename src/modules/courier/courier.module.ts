import { Module } from "@nestjs/common";
import { CourierService } from "./courier.service";
import { CourierController } from "./courier.controller";
import { SteadfastAdapter } from "./steadfast.adapter";
import { PathaoAdapter } from "./pathao.adapter";
import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [CourierController],
  providers: [CourierService, SteadfastAdapter, PathaoAdapter],
  exports: [CourierService],
})
export class CourierModule {}
