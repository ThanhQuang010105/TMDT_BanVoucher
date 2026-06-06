import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

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

  // Ghi nhật ký hệ thống (BR-ADM-07, RB-12)
  async writeLog(maTk: string, hanhDong: string) {
    try {
      const maNk = `NK-${uuidv4().slice(0, 8).toUpperCase()}`;
      await this.adminClient.from('nhat_ky_he_thong').insert({
        ma_nk: maNk,
        ma_tk: maTk,
        hanh_dong: hanhDong,
      });
    } catch (err) {
      console.error('Lỗi ghi log hệ thống:', err);
    }
  }
}