import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomersModule } from './modules/customers/customers.module';
import { VouchersModule } from './modules/vouchers/vouchers.module';
import { OrdersModule } from './modules/orders/orders.module';
import { AdminModule } from './modules/admin/admin.module';
import { CronjobModule } from './modules/cronjob/cronjob.module';
import { RedemptionModule } from './modules/redemption/redemption.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Kích hoạt đọc file .env toàn cục
    SupabaseModule,
    AuthModule,
    CustomersModule,
    VouchersModule,
    OrdersModule,
    AdminModule,
    CronjobModule,
    RedemptionModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
