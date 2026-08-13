import {
  Controller,
  Post,
  Get,
  Param,
  Patch,
  Delete,
  Body,
  UseGuards,
  Query,
  BadRequestException,
} from "@nestjs/common";
import { ReviewsService } from "./reviews.service";
import {
  CreateReviewDto,
  UpdateReviewDto,
  PaginatedReviewsDto,
} from "./dto/review.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser("id") userId: string, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(userId, dto);
  }

  @Get("product/:productId")
  findByProduct(
    @Param("productId") productId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ): Promise<PaginatedReviewsDto> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    if (pageNum < 1 || limitNum < 1) {
      throw new BadRequestException("Page and limit must be positive integers");
    }
    return this.reviewsService.findByProduct(productId, pageNum, limitNum);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser("id") userId: string,
    @CurrentUser("role") userRole: string,
    @Param("id") id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(id, userId, userRole, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(
    @CurrentUser("id") userId: string,
    @CurrentUser("role") userRole: string,
    @Param("id") id: string,
  ) {
    return this.reviewsService.remove(id, userId, userRole);
  }
}
