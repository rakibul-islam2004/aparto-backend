import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewResponseDto,
  PaginatedReviewsDto,
} from "./dto/review.dto";

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const existing = await this.prisma.review.findFirst({
      where: { userId, productId: dto.productId },
    });
    if (existing)
      throw new BadRequestException("You have already reviewed this product");

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) throw new BadRequestException("Product not found");

    const review = await this.prisma.review.create({
      data: {
        userId,
        productId: dto.productId,
        rating: dto.rating,
        title: dto.title,
        comment: dto.comment,
      },
      include: { user: true },
    });

    return this.mapToResponse(review);
  }

  async findByProduct(
    productId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedReviewsDto> {
    const skip = (page - 1) * limit;
    const where: any = { productId, isActive: true };

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      data: reviews.map((r) => this.mapToResponse(r)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<ReviewResponseDto> {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!review) throw new NotFoundException("Review not found");
    return this.mapToResponse(review);
  }

  async update(
    id: string,
    userId: string,
    userRole: string,
    dto: UpdateReviewDto,
  ): Promise<ReviewResponseDto> {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException("Review not found");

    if (
      review.userId !== userId &&
      userRole !== "ADMIN" &&
      userRole !== "SUPER_ADMIN"
    ) {
      throw new ForbiddenException("You can only update your own reviews");
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: dto,
      include: { user: true },
    });

    return this.mapToResponse(updated);
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException("Review not found");

    if (
      review.userId !== userId &&
      userRole !== "ADMIN" &&
      userRole !== "SUPER_ADMIN"
    ) {
      throw new ForbiddenException("You can only delete your own reviews");
    }

    await this.prisma.review.delete({ where: { id } });
  }

  private mapToResponse(review: any): ReviewResponseDto {
    return {
      id: review.id,
      userId: review.userId,
      userName: review.user?.name || "Anonymous",
      productId: review.productId,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      isVerified: review.isVerified,
      isActive: review.isActive,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }
}
