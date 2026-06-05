import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './modules/auth/auth.module';
import { CustomersModule } from './modules/customers/customers.module';
import { VouchersModule } from './modules/vouchers/vouchers.module';
import { OrdersModule } from './modules/orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Kích hoạt đọc file .env toàn cục
    SupabaseModule,
    AuthModule,
    CustomersModule,
    VouchersModule,
    OrdersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
