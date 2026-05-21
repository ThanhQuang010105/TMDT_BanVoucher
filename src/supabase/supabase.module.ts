import { Module, Global } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Global() // Đánh dấu là Module Toàn cục
@Module({
  providers:[SupabaseService],
  exports:[SupabaseService], // Export ra để các service khác inject được
})
export class SupabaseModule {}