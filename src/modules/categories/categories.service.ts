import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateCategoryDto, UpdateCategoryDto, CategoryResponseDto } from "./dto/category.dto";
import { RoomType } from "@prisma/client";

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const slug = dto.slug || dto.name.toLowerCase().replace(/\s+/g, "-");
    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) throw new ConflictException("Category slug already exists");

    const prefix = dto.prefix || this.generatePrefix();
    const existingPrefix = await this.prisma.category.findUnique({ where: { prefix } });
    if (existingPrefix) throw new ConflictException("Category prefix already exists");

    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        prefix,
        parentId: dto.parentId,
        roomType: dto.roomType,
        image: dto.image,
        icon: dto.icon,
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
    });
    return this.mapToResponse(category);
  }

  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return categories.map(this.mapToResponse);
  }

  async findTree(): Promise<CategoryResponseDto[]> {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { children: true },
    });

    const map = new Map<string, CategoryResponseDto>();
    const roots: CategoryResponseDto[] = [];

    for (const cat of categories) {
      const node = this.mapToResponse(cat);
      node.children = [];
      map.set(cat.id, node);
    }

    for (const cat of categories) {
      const node = map.get(cat.id)!;
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async findOne(id: string): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException("Category not found");
    return this.mapToResponse(category);
  }

  async findBySlug(slug: string): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findUnique({ where: { slug } });
    if (!category) throw new NotFoundException("Category not found");
    return this.mapToResponse(category);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException("Category not found");

    const slug = dto.slug || category.slug;
    if (slug !== category.slug) {
      const existing = await this.prisma.category.findUnique({ where: { slug } });
      if (existing) throw new ConflictException("Category slug already exists");
    }

    const prefix = dto.prefix || category.prefix;
    if (prefix !== category.prefix) {
      const existing = await this.prisma.category.findUnique({ where: { prefix } });
      if (existing) throw new ConflictException("Category prefix already exists");
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: dto,
    });
    return this.mapToResponse(updated);
  }

  async remove(id: string): Promise<void> {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException("Category not found");

    const productCount = await this.prisma.product.count({
      where: { categoryId: id },
    });
    if (productCount > 0) {
      await this.prisma.category.update({
        where: { id },
        data: { isActive: false },
      });
      return;
    }

    await this.prisma.category.delete({ where: { id } });
  }

  async findByRoomType(roomType: RoomType): Promise<CategoryResponseDto[]> {
    const categories = await this.prisma.category.findMany({
      where: { roomType, isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return categories.map(this.mapToResponse);
  }

  private generatePrefix(): string {
    const count = this.prisma.category.count();
    const next = (count as any) + 1;
    return next.toString().padStart(2, "0");
  }

  private mapToResponse(category: any): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      prefix: category.prefix,
      parentId: category.parentId,
      roomType: category.roomType,
      image: category.image,
      icon: category.icon,
      description: category.description,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
