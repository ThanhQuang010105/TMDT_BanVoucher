import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  // Client dùng cho Auth (signIn/signUp/signOut) - session có thể bị ghi đè sau khi user đăng nhập
  private authClient!: SupabaseClient;

  // Client dùng CHỈ cho DB operations (INSERT/SELECT/UPDATE/DELETE)
  // Không bao giờ gọi signIn/signUp trên client này → session luôn là service_role → bypass RLS
  private adminClient!: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Thiếu cấu hình SUPABASE_URL hoặc SUPABASE_KEY trong file .env');
    }

    this.authClient = createClient(supabaseUrl, supabaseKey);

    this.adminClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false, // Không lưu session → giữ nguyên service_role cho DB ops
      },
    });
  }

  // Dùng cho tất cả thao tác database (INSERT, SELECT, UPDATE, DELETE)
  getClient(): SupabaseClient {
    return this.adminClient;
  }

  // Dùng riêng cho Auth operations (signInWithPassword, signOut, signUp)
  getAuthClient(): SupabaseClient {
    return this.authClient;
  }
}