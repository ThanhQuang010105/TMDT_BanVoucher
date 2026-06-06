import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterPartnerDto } from './dto/register-partner.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // ─── ĐĂNG KÝ TÀI KHOẢN KHÁCH HÀNG ──────────────────────────────────────────
  async register(dto: RegisterDto) {
    // adminClient: dùng admin.createUser() → không tạo session, không gây lỗi RLS cho DB ops sau đó
    const adminClient = this.supabaseService.getClient();

    // Bước 1: Tạo user trên Supabase Auth bằng Admin API (không tạo session, không ghi đè service_role)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true, // Tự động xác nhận email, không cần bấm link email
    });

    if (authError) {
      if (authError.message.toLowerCase().includes('already registered') ||
          authError.message.toLowerCase().includes('already been registered') ||
          (authError as any).code === 'email_exists') {
        throw new ConflictException('Email này đã được sử dụng. Vui lòng đăng nhập.');
      }
      throw new BadRequestException(authError.message);
    }

    const userId = authData.user?.id;
    if (!userId) throw new InternalServerErrorException('Không thể tạo tài khoản Auth.');

    // Bước 2: Tạo bản ghi trong bảng tai_khoan (adminClient luôn dùng service_role → bypass RLS)
    const { error: tkError } = await adminClient.from('tai_khoan').insert({
      ma_tk: userId,
      username: dto.email,
      vai_tro: 'khach_hang',
      trang_thai_hoat_dong: 'active',
    });

    if (tkError) throw new InternalServerErrorException(`Lỗi tạo tai_khoan: ${tkError.message}`);

    // Bước 3: Tạo bản ghi trong bảng khach_hang
    const maKh = `KH-${uuidv4().slice(0, 8).toUpperCase()}`;
    const { error: khError } = await adminClient.from('khach_hang').insert({
      ma_kh: maKh,
      ma_tk: userId,
      ho_ten: dto.ho_ten,
      sdt: dto.sdt ?? null,
      dia_chi: dto.dia_chi ?? null,
      email: dto.email,
    });

    if (khError) throw new InternalServerErrorException(`Lỗi tạo khach_hang: ${khError.message}`);

    // Ghi log hệ thống
    await this.supabaseService.writeLog(userId, 'Đăng ký tài khoản khách hàng mới');

    return {
      message: 'Đăng ký thành công! Tài khoản đã được kích hoạt, bạn có thể đăng nhập ngay.',
      ma_kh: maKh,
    };
  }

  // ─── ĐĂNG KÝ TÀI KHOẢN ĐỐI TÁC (BR-PAR-01) ──────────────────────────────────
  async registerPartner(dto: RegisterPartnerDto) {
    const adminClient = this.supabaseService.getClient();

    // Bước 1: Tạo user trên Supabase Auth bằng Admin API
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.toLowerCase().includes('already registered') ||
          authError.message.toLowerCase().includes('already been registered') ||
          (authError as any).code === 'email_exists') {
        throw new ConflictException('Email này đã được sử dụng. Vui lòng đăng nhập.');
      }
      throw new BadRequestException(authError.message);
    }

    const userId = authData.user?.id;
    if (!userId) throw new InternalServerErrorException('Không thể tạo tài khoản Auth.');

    // Bước 2: Tạo bản ghi trong bảng tai_khoan với trạng thái hoạt động ban đầu là 'pending'
    const { error: tkError } = await adminClient.from('tai_khoan').insert({
      ma_tk: userId,
      username: dto.email,
      vai_tro: 'doi_tac',
      trang_thai_hoat_dong: 'pending', // Cần admin duyệt
    });

    if (tkError) throw new InternalServerErrorException(`Lỗi tạo tai_khoan: ${tkError.message}`);

    // Bước 3: Tạo hồ sơ trong bảng doi_tac
    const maDt = `DT-${uuidv4().slice(0, 8).toUpperCase()}`;
    const { error: dtError } = await adminClient.from('doi_tac').insert({
      ma_dt: maDt,
      ma_tk: userId,
      ten_doanh_nghiep: dto.ten_doanh_nghiep,
      nguoi_dai_dien: dto.nguoi_dai_dien ?? null,
      ma_so_thue: dto.ma_so_thue ?? null,
      trang_thai_duyet: 'pending',
    });

    if (dtError) throw new InternalServerErrorException(`Lỗi tạo doi_tac: ${dtError.message}`);

    // Ghi log hệ thống
    await this.supabaseService.writeLog(userId, `Đăng ký hồ sơ đối tác mới: ${dto.ten_doanh_nghiep}`);

    return {
      success: true,
      message: 'Đăng ký tài khoản đối tác thành công! Vui lòng chờ Admin phê duyệt hồ sơ.',
      ma_dt: maDt,
    };
  }

  // ─── ĐĂNG NHẬP ──────────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    // authClient: dùng cho signInWithPassword (session sẽ bị ghi đè sang user JWT - OK vì chỉ dùng authClient)
    const authClient = this.supabaseService.getAuthClient();
    // adminClient: dùng cho DB query sau khi lấy được userId (luôn giữ service_role)
    const adminClient = this.supabaseService.getClient();

    const { data, error } = await authClient.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng.');
    }

    // Lấy thông tin vai trò từ bảng tai_khoan bằng adminClient (không bị ảnh hưởng bởi session của authClient)
    const { data: taiKhoan } = await adminClient
      .from('tai_khoan')
      .select('vai_tro, trang_thai_hoat_dong')
      .eq('ma_tk', data.user.id)
      .single();

    if (taiKhoan?.trang_thai_hoat_dong !== 'active') {
      throw new UnauthorizedException('Tài khoản của bạn đã bị khóa hoặc đang chờ phê duyệt. Vui lòng liên hệ hỗ trợ.');
    }

    // Ghi log đăng nhập
    await this.supabaseService.writeLog(data.user.id, 'Đăng nhập vào hệ thống');

    return {
      message: 'Đăng nhập thành công.',
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        vai_tro: taiKhoan?.vai_tro,
      },
    };
  }

  // ─── ĐĂNG XUẤT ──────────────────────────────────────────────────────────────
  async logout(accessToken: string) {
    const authClient = this.supabaseService.getAuthClient();
    const { data: { user } } = await authClient.auth.getUser(accessToken);

    await authClient.auth.setSession({ access_token: accessToken, refresh_token: '' });
    const { error } = await authClient.auth.signOut();

    if (error) throw new InternalServerErrorException(error.message);

    if (user) {
      await this.supabaseService.writeLog(user.id, 'Đăng xuất khỏi hệ thống');
    }

    return { message: 'Đăng xuất thành công.' };
  }

  // ─── QUÊN MẬT KHẨU ──────────────────────────────────────────────────────────
  async forgotPassword(dto: ForgotPasswordDto) {
    const authClient = this.supabaseService.getAuthClient();

    const { error } = await authClient.auth.resetPasswordForEmail(dto.email, {
      redirectTo: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/reset-password`,
    });

    if (error) throw new BadRequestException(error.message);

    return {
      message: 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi link đặt lại mật khẩu.',
    };
  }

  // ─── ĐẶT LẠI MẬT KHẨU ──────────────────────────────────────────────────────
  async resetPassword(dto: ResetPasswordDto) {
    const authClient = this.supabaseService.getAuthClient();

    await authClient.auth.setSession({
      access_token: dto.access_token,
      refresh_token: '',
    });

    const { error } = await authClient.auth.updateUser({
      password: dto.new_password,
    });

    if (error) throw new BadRequestException(`Đặt lại mật khẩu thất bại: ${error.message}`);

    return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }
}
