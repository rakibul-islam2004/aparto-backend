import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { CmsService } from "./cms.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("cms")
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Get("homepage")
  async getHomepage() {
    return this.cmsService.getHomepageConfig();
  }

  @Post("sections")
  @UseGuards(JwtAuthGuard)
  async createSection(
    @Body()
    dto: {
      type: string;
      title?: string;
      content: any;
      sortOrder?: number;
    },
  ) {
    return this.cmsService.createSection(dto);
  }

  @Patch("sections/:id")
  @UseGuards(JwtAuthGuard)
  async updateSection(@Param("id") id: string, @Body() dto: any) {
    return this.cmsService.updateSection(id, dto);
  }

  @Post("sections/reorder")
  @UseGuards(JwtAuthGuard)
  async reorderSections(@Body() body: { orderedIds: string[] }) {
    return this.cmsService.reorderSections(body.orderedIds);
  }

  @Post("theme")
  @UseGuards(JwtAuthGuard)
  async updateTheme(@Body() settings: Record<string, any>) {
    return this.cmsService.updateThemeSettings(settings);
  }
}
