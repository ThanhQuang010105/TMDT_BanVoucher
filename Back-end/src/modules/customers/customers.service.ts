import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // ─── LẤY HỒ SƠ CÁ NHÂN ─────────────────────────────────────────────────────
  async getMyProfile(accessToken: string) {
    const client = this.supabaseService.getClient();

    // Xác thực token và lấy thông tin user hiện tại
    const { data: { user }, error: authError } = await client.auth.getUser(accessToken);
    if (authError || !user) throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn.');

    // Lấy thông tin hồ sơ từ bảng khach_hang
    const { data, error } = await client
      .from('khach_hang')
      .select('ma_kh, ho_ten, sdt, dia_chi, email')
      .eq('ma_tk', user.id)
      .single();

    if (error || !data) throw new NotFoundException('Không tìm thấy hồ sơ khách hàng.');

    return { data };
  }

  // ─── CẬP NHẬT HỒ SƠ CÁ NHÂN ────────────────────────────────────────────────
  async updateMyProfile(accessToken: string, dto: UpdateProfileDto) {
    const client = this.supabaseService.getClient();

    const { data: { user }, error: authError } = await client.auth.getUser(accessToken);
    if (authError || !user) throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn.');

    // Chỉ cập nhật các field được gửi lên (không ghi đè field chưa gửi)
    const updatePayload: Record<string, any> = {};
    if (dto.ho_ten !== undefined) updatePayload.ho_ten = dto.ho_ten;
    if (dto.sdt !== undefined) updatePayload.sdt = dto.sdt;
    if (dto.dia_chi !== undefined) updatePayload.dia_chi = dto.dia_chi;

    if (Object.keys(updatePayload).length === 0) {
      throw new BadRequestException('Không có dữ liệu nào được cập nhật.');
    }

    const { data, error } = await client
      .from('khach_hang')
      .update(updatePayload)
      .eq('ma_tk', user.id)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    return { message: 'Cập nhật hồ sơ thành công.', data };
  }

  // ─── ĐỔI MẬT KHẨU ───────────────────────────────────────────────────────────
  async changePassword(accessToken: string, dto: ChangePasswordDto) {
    const client = this.supabaseService.getClient();

    // Xác thực mật khẩu cũ bằng cách đăng nhập lại
    const { data: { user }, error: authError } = await client.auth.getUser(accessToken);
    if (authError || !user) throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn.');

    // Thử đăng nhập lại với mật khẩu cũ để xác minh
    const { error: verifyError } = await client.auth.signInWithPassword({
      email: user.email!,
      password: dto.old_password,
    });
    if (verifyError) throw new BadRequestException('Mật khẩu cũ không đúng.');

    // Cập nhật mật khẩu mới
    await client.auth.setSession({ access_token: accessToken, refresh_token: '' });
    const { error: updateError } = await client.auth.updateUser({
      password: dto.new_password,
    });

    if (updateError) throw new BadRequestException(updateError.message);

    return { message: 'Đổi mật khẩu thành công.' };
  }
}