import { Injectable, NotFoundException, ConflictException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateProductDto, UpdateProductDto, ProductResponseDto, CreateVariantDto, UpdateVariantDto, VariantResponseDto } from "./dto/product.dto";
import { BarcodesService } from "../barcodes/barcodes.service";

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService, private readonly barcodesService: BarcodesService) {}

  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    const slug = dto.slug || dto.name.toLowerCase().replace(/\s+/g, "-");
    const existing = await this.prisma.product.findUnique({ where: { slug } });
    if (existing) throw new ConflictException("Product slug already exists");

    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new BadRequestException("Invalid category");

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        brandId: dto.brandId,
        categoryId: dto.categoryId,
        tags: dto.tags || [],
        status: dto.status || "DRAFT",
        roomTypes: (dto.roomTypes || []) as any,
      },
    });
    return this.mapProductToResponse(product);
  }

  async findAll(filters?: { categoryId?: string; brandId?: string; status?: string; search?: string; page?: number; limit?: number }) {
    const where: any = {};
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.brandId) where.brandId = filters.brandId;
    if (filters?.status) where.status = filters.status as any;
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const page = filters?.page && filters.page > 0 ? filters.page : 1;
    const limit = filters?.limit && filters.limit > 0 ? filters.limit : 20;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true, brand: true, variants: true, media: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products.map(p => this.mapProductToResponse(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async search(query: string) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const products = await this.prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { tags: { has: query } },
        ],
        status: "ACTIVE",
      },
      include: { category: true, brand: true, variants: true, media: { where: { isPrimary: true } } },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    const suggestions = new Set<string>();
    products.forEach((p) => {
      p.tags.forEach((tag: string) => {
        if (tag.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(tag);
        }
      });
      if (p.name.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(p.name);
      }
    });

    return {
      products: products.map(p => this.mapProductToResponse(p)),
      suggestions: Array.from(suggestions).slice(0, 10),
    };
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, brand: true, variants: true, media: true },
    });
    if (!product) throw new NotFoundException("Product not found");
    return this.mapProductToResponse(product);
  }

  async findBySlug(slug: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { category: true, brand: true, variants: true, media: true },
    });
    if (!product) throw new NotFoundException("Product not found");
    return this.mapProductToResponse(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException("Product not found");

    const slug = dto.slug || product.slug;
    if (slug !== product.slug) {
      const existing = await this.prisma.product.findUnique({ where: { slug } });
      if (existing) throw new ConflictException("Product slug already exists");
    }

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
      if (!category) throw new BadRequestException("Invalid category");
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        brandId: dto.brandId,
        categoryId: dto.categoryId,
        tags: dto.tags,
        status: dto.status,
        roomTypes: dto.roomTypes as any,
      },
      include: { category: true, brand: true, variants: true, media: true },
    });
    return this.mapProductToResponse(updated);
  }

  async remove(id: string): Promise<void> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException("Product not found");
    await this.prisma.product.delete({ where: { id } });
  }

  async createVariant(productId: string, dto: CreateVariantDto): Promise<VariantResponseDto> {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException("Product not found");

    const existingSku = await this.prisma.productVariant.findUnique({ where: { sku: dto.sku } });
    if (existingSku) throw new ConflictException("SKU already exists");

    const barcode = dto.barcode || (await this.barcodesService.generate12DigitBarcode("10", "0001")).barcode;
    const existingBarcode = await this.prisma.productVariant.findUnique({ where: { barcode } });
    if (existingBarcode) throw new ConflictException("Barcode already exists");

    const variant = await this.prisma.productVariant.create({
      data: {
        productId,
        sku: dto.sku,
        barcode,
        attributes: dto.attributes || {},
        price: dto.price,
        salePrice: dto.salePrice,
        cost: dto.cost,
        weight: dto.weight,
        isActive: dto.isActive ?? true,
      },
    });
    return this.mapVariantToResponse(variant);
  }

  async updateVariant(productId: string, variantId: string, dto: UpdateVariantDto): Promise<VariantResponseDto> {
    const variant = await this.prisma.productVariant.findFirst({ where: { id: variantId, productId } });
    if (!variant) throw new NotFoundException("Variant not found");

    if (dto.sku && dto.sku !== variant.sku) {
      const existing = await this.prisma.productVariant.findUnique({ where: { sku: dto.sku } });
      if (existing) throw new ConflictException("SKU already exists");
    }

    if (dto.barcode && dto.barcode !== variant.barcode) {
      const existing = await this.prisma.productVariant.findUnique({ where: { barcode: dto.barcode } });
      if (existing) throw new ConflictException("Barcode already exists");
    }

    const updated = await this.prisma.productVariant.update({
      where: { id: variantId },
      data: dto,
    });
    return this.mapVariantToResponse(updated);
  }

  private mapProductToResponse(product: any): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      brandId: product.brandId,
      categoryId: product.categoryId,
      tags: product.tags || [],
      status: product.status,
      roomTypes: product.roomTypes || [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      variants: product.variants?.map((v: any) => this.mapVariantToResponse(v)),
      media: product.media,
    };
  }

  private mapVariantToResponse(variant: any): VariantResponseDto {
    return {
      id: variant.id,
      productId: variant.productId,
      sku: variant.sku,
      barcode: variant.barcode,
      attributes: variant.attributes || {},
      price: Number(variant.price),
      salePrice: variant.salePrice ? Number(variant.salePrice) : undefined,
      cost: Number(variant.cost),
      weight: variant.weight ? Number(variant.weight) : undefined,
      isActive: variant.isActive,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
    };
  }
}
