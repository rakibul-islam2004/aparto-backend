import { PrismaClient, Role, RoomType, ProductStatus, ApartmentSize } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Admin@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@aparto.com.bd' },
    update: {},
    create: {
      email: 'admin@aparto.com.bd',
      name: 'Aparto Admin',
      password: adminPassword,
      role: Role.SUPER_ADMIN,
      emailVerified: true,
    },
  });

  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'WH-DHK-01' },
    update: {},
    create: {
      name: 'Dhaka Main Warehouse',
      code: 'WH-DHK-01',
      address: 'Tejgaon, Dhaka',
    },
  });

  const categories = [
    { name: 'Bathroom Accessories', slug: 'bathroom', prefix: '01', roomType: RoomType.BATHROOM },
    { name: 'Bedroom Decor', slug: 'bedroom', prefix: '02', roomType: RoomType.BEDROOM },
    { name: 'Kitchen & Dining', slug: 'kitchen', prefix: '03', roomType: RoomType.KITCHEN },
    { name: 'Living Room', slug: 'living-room', prefix: '04', roomType: RoomType.LIVING_ROOM },
    { name: 'Storage Solutions', slug: 'storage', prefix: '05', roomType: null },
    { name: 'Lighting', slug: 'lighting', prefix: '06', roomType: null },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  const bathroom = await prisma.category.findUnique({ where: { slug: 'bathroom' } });
  const brand = await prisma.brand.upsert({
    where: { slug: 'aparto-home' },
    update: {},
    create: { name: 'Aparto Home', slug: 'aparto-home' },
  });

  if (bathroom) {
    const product = await prisma.product.upsert({
      where: { slug: 'wall-mounted-soap-dispenser' },
      update: {},
      create: {
        name: 'Wall Mounted Soap Dispenser',
        slug: 'wall-mounted-soap-dispenser',
        description: 'Space-saving soap dispenser for modern bathrooms',
        categoryId: bathroom.id,
        brandId: brand.id,
        status: ProductStatus.ACTIVE,
        roomTypes: [RoomType.BATHROOM],
        tags: ['bathroom', 'storage', 'wall-mounted'],
      },
    });

    const variant = await prisma.productVariant.upsert({
      where: { sku: 'AP-01001-001' },
      update: {},
      create: {
        productId: product.id,
        sku: 'AP-01001-001',
        barcode: '880010010001',
        attributes: {
          color: 'White',
          material: 'ABS Plastic',
          mountingType: 'wall-mounted',
          spaceSaving: true,
        },
        price: 850,
        cost: 500,
      },
    });

    await prisma.inventory.upsert({
      where: { variantId_warehouseId: { variantId: variant.id, warehouseId: warehouse.id } },
      update: {},
      create: {
        variantId: variant.id,
        warehouseId: warehouse.id,
        onHand: 100,
        available: 100,
      },
    });

    await prisma.productMedia.upsert({
      where: { id: 'seed-media-1' },
      update: {},
      create: {
        id: 'seed-media-1',
        productId: product.id,
        type: 'IMAGE',
        url: 'https://placehold.co/600x600?text=Soap+Dispenser',
        altText: 'Wall Mounted Soap Dispenser',
        isPrimary: true,
      },
    });
  }

  await prisma.homepageSection.createMany({
    data: [
      {
        type: 'hero',
        title: 'Welcome to Aparto',
        content: {
          headline: 'Apartment Accessories for Modern Living',
          subheadline: 'Space-saving solutions for Bangladeshi apartments',
          ctaText: 'Shop Now',
          ctaLink: '/shop',
          image: 'https://placehold.co/1200x400?text=Aparto+Hero',
        },
        sortOrder: 0,
      },
      {
        type: 'categories',
        title: 'Shop by Room',
        content: { showRoomNavigation: true },
        sortOrder: 1,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.bundle.upsert({
    where: { slug: 'studio-starter-kit' },
    update: {},
    create: {
      name: 'Studio Starter Kit',
      slug: 'studio-starter-kit',
      description: 'Essential accessories for studio apartments',
      apartmentSize: ApartmentSize.STUDIO,
      price: 4999,
      salePrice: 4499,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      type: 'PERCENTAGE',
      value: 10,
      minOrderValue: 1000,
      maxUses: 1000,
    },
  });

  console.log('Seed completed. Admin:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
