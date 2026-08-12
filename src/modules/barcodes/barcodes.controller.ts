import { Controller, Post, Body, Get, Param, UseGuards } from "@nestjs/common";
import { BarcodesService } from "./barcodes.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("barcodes")
export class BarcodesController {
  constructor(private readonly barcodesService: BarcodesService) {}

  @Post("generate")
  @UseGuards(JwtAuthGuard)
  async generateBarcode(
    @Body() body: { categoryPrefix: string; variantAttrCode: string },
  ) {
    return this.barcodesService.generate12DigitBarcode(
      body.categoryPrefix,
      body.variantAttrCode,
    );
  }

  @Get("preview/:categoryPrefix/:variantCode")
  async previewBarcode(
    @Param("categoryPrefix") categoryPrefix: string,
    @Param("variantCode") variantCode: string,
  ) {
    return this.barcodesService.generate12DigitBarcode(
      categoryPrefix,
      variantCode,
    );
  }
}
