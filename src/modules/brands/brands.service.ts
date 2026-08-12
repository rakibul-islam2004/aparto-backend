import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateBrandDto, UpdateBrandDto, BrandResponseDto } from "./dto/brand.dto";

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBrandDto): Promise<BrandResponseDto> {
    const slug = dto.slug || dto.name.toLowerCase().replace(/\s+/g, "-");
    const existing = await this.prisma.brand.findUnique({ where: { slug } });
    if (existing) throw new ConflictException("Brand slug already exists");

    const brand = await this.prisma.brand.create({
      data: {
        name: dto.name,
        slug,
        logo: dto.logo,
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
    });
    return this.mapToResponse(brand);
  }

  async findAll(): Promise<BrandResponseDto[]> {
    const brands = await this.prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return brands.map(this.mapToResponse);
  }

  async findOne(id: string): Promise<BrandResponseDto> {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundException("Brand not found");
    return this.mapToResponse(brand);
  }

  async findBySlug(slug: string): Promise<BrandResponseDto> {
    const brand = await this.prisma.brand.findUnique({ where: { slug } });
    if (!brand) throw new NotFoundException("Brand not found");
    return this.mapToResponse(brand);
  }

  async update(id: string, dto: UpdateBrandDto): Promise<BrandResponseDto> {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundException("Brand not found");

    const slug = dto.slug || brand.slug;
    if (slug !== brand.slug) {
      const existing = await this.prisma.brand.findUnique({ where: { slug } });
      if (existing) throw new ConflictException("Brand slug already exists");
    }

    const updated = await this.prisma.brand.update({
      where: { id },
      data: dto,
    });
    return this.mapToResponse(updated);
  }

  async remove(id: string): Promise<void> {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundException("Brand not found");

    const productCount = await this.prisma.product.count({
      where: { brandId: id },
    });
    if (productCount > 0) {
      await this.prisma.brand.update({
        where: { id },
        data: { isActive: false },
      });
      return;
    }

    await this.prisma.brand.delete({ where: { id } });
  }

  private mapToResponse(brand: any): BrandResponseDto {
    return {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      logo: brand.logo,
      description: brand.description,
      isActive: brand.isActive,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    };
  }
}
