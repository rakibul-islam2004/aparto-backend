import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { BrandsModule } from "./modules/brands/brands.module";
import { ProductsModule } from "./modules/products/products.module";
import { CartModule } from "./modules/cart/cart.module";
import { WishlistModule } from "./modules/wishlist/wishlist.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { BarcodesModule } from "./modules/barcodes/barcodes.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { CourierModule } from "./modules/courier/courier.module";
import { CmsModule } from "./modules/cms/cms.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    BrandsModule,
    ProductsModule,
    CartModule,
    WishlistModule,
    InventoryModule,
    BarcodesModule,
    PaymentsModule,
    CourierModule,
    CmsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
