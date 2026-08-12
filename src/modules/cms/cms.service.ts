import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

  async getHomepageConfig() {
    const sections = await this.prisma.homepageSection.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    const settings = await this.prisma.setting.findMany({
      where: { category: 'THEME' },
    });

    return {
      sections,
      settings,
    };
  }

  async createSection(dto: { type: string; title?: string; content: any; sortOrder?: number }) {
    return this.prisma.homepageSection.create({
      data: {
        type: dto.type,
        title: dto.title,
        content: dto.content,
        sortOrder: dto.sortOrder || 0,
      },
    });
  }

  async updateSection(id: string, dto: { title?: string; content?: any; sortOrder?: number; isActive?: boolean }) {
    const existing = await this.prisma.homepageSection.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Section not found');

    return this.prisma.homepageSection.update({
      where: { id },
      data: dto,
    });
  }

  async reorderSections(orderedIds: string[]) {
    const updates = orderedIds.map((id, index) =>
      this.prisma.homepageSection.update({
        where: { id },
        data: { sortOrder: index },
      }),
    );
    await this.prisma.$transaction(updates);
    return { success: true };
  }

  async updateThemeSettings(settingsObj: Record<string, any>) {
    const operations = Object.entries(settingsObj).map(([key, value]) =>
      this.prisma.setting.upsert({
        where: { key },
        update: { value, category: 'THEME' },
        create: { key, value, category: 'THEME' },
      }),
    );
    await this.prisma.$transaction(operations);
    return { success: true };
  }
}
