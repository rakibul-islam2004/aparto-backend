import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Query } from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto, UpdateCategoryDto } from "../dto/category.dto";
import { RoomType } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get("tree")
  findTree() {
    return this.categoriesService.findTree();
  }

  @Get("room/:roomType")
  findByRoomType(@Param("roomType") roomType: RoomType) {
    return this.categoriesService.findByRoomType(roomType);
  }

  @Get("slug/:slug")
  findBySlug(@Param("slug") slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  update(@Param("id") id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@Param("id") id: string) {
    return this.categoriesService.remove(id);
  }
}
