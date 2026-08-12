import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Query } from "@nestjs/common";
import { BrandsService } from "./brands.service";
import { CreateBrandDto, UpdateBrandDto } from "../dto/brand.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("brands")
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateBrandDto) {
    return this.brandsService.create(dto);
  }

  @Get()
  findAll() {
    return this.brandsService.findAll();
  }

  @Get("slug/:slug")
  findBySlug(@Param("slug") slug: string) {
    return this.brandsService.findBySlug(slug);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.brandsService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  update(@Param("id") id: string, @Body() dto: UpdateBrandDto) {
    return this.brandsService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@Param("id") id: string) {
    return this.brandsService.remove(id);
  }
}
