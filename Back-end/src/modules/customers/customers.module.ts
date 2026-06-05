import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { SupabaseModule } from '../../supabase/supabase.module';

@Module({
  imports: [SupabaseModule], // Kéo module kết nối DB vào
  controllers: [CustomersController],
  providers: [CustomersService], //Khai báo service có thể sử dụng
})
export class CustomersModule {}