import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabaseClient!: SupabaseClient;

  constructor(private configService: ConfigService) {}

  // Hàm này tự động chạy ngay khi NestJS khởi động module
  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (!supabaseUrl ||!supabaseKey) {
      throw new Error('Thiếu cấu hình SUPABASE_URL hoặc SUPABASE_KEY trong file.env');
    }

    this.supabaseClient = createClient(supabaseUrl, supabaseKey);
  }

  // Hàm expose client ra ngoài cho các service khác sử dụng
  getClient(): SupabaseClient {
    return this.supabaseClient;
  }
}