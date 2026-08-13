import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Query } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { CreateProductDto, UpdateProductDto } from "./dto/product.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  findAll(@Query() filters: any) {
    return this.productsService.findAll(filters);
  }

  @Get("search")
  search(@Query("q") query: string) {
    return this.productsService.search(query);
  }

  @Get("slug/:slug")
  findBySlug(@Param("slug") slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  update(@Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@Param("id") id: string) {
    return this.productsService.remove(id);
  }

  @Post(":id/variants")
  @UseGuards(JwtAuthGuard)
  createVariant(@Param("id") productId: string, @Body() dto: any) {
    return this.productsService.createVariant(productId, dto);
  }

  @Patch(":id/variants/:variantId")
  @UseGuards(JwtAuthGuard)
  updateVariant(@Param("id") productId: string, @Param("variantId") variantId: string, @Body() dto: any) {
    return this.productsService.updateVariant(productId, variantId, dto);
  }
}
