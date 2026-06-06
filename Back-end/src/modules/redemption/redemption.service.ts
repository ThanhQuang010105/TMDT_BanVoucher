import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class RedemptionService {
  constructor(private supabase: SupabaseService) {}

  // Kiểm tra 3 lớp và xác thực mã voucher (BR-PAR-05, RB-07, RB-09)
  async verifyVoucherCode(ma_voucher_code: string, ma_cn: string) {
    // Lớp 1: Mã có tồn tại không?
    const { data: code, error } = await this.supabase
      .getClient()
      .from('voucher_phat_hanh')
      .select('*, voucher(*)')
      .eq('ma_voucher_code', ma_voucher_code)
      .single();

    if (error || !code) {
      throw new NotFoundException('Mã voucher không tồn tại');
    }

    // Mã đã được sử dụng chưa? (RB-07)
    if (code.trang_thai === 'da_su_dung') {
      throw new BadRequestException('Mã voucher này đã được sử dụng');
    }

    // Lớp 2: Voucher còn hạn không? (RB-08)
    const now = new Date();
    const ngayKetThuc = new Date(code.voucher.ngay_kt);
    if (now > ngayKetThuc) {
      throw new BadRequestException('Voucher đã hết hạn sử dụng');
    }

    if (code.voucher.trang_thai !== 'active') {
      throw new BadRequestException('Voucher không còn hiệu lực');
    }

    // Lớp 3: Chi nhánh có được áp dụng không? (RB-09)
    const { data: chiNhanh } = await this.supabase
      .getClient()
      .from('voucher_chi_nhanh')
      .select('*')
      .eq('ma_voucher', code.ma_voucher)
      .eq('ma_cn', ma_cn)
      .single();

    if (!chiNhanh) {
      throw new BadRequestException('Chi nhánh này không được áp dụng voucher');
    }

    return {
      success: true,
      data: code,
      message: 'Mã voucher hợp lệ',
    };
  }

  // Xác nhận sử dụng voucher → cập nhật da_su_dung (BR-PAR-06)
  async redeemVoucherCode(ma_voucher_code: string, ma_cn: string, userId?: string) {
    // Kiểm tra 3 lớp trước
    await this.verifyVoucherCode(ma_voucher_code, ma_cn);

    // Cập nhật trạng thái thành da_su_dung
    const { data, error } = await this.supabase
      .getClient()
      .from('voucher_phat_hanh')
      .update({
        trang_thai: 'da_su_dung',
        ngay_su_dung: new Date().toISOString(),
        ma_cn: ma_cn,
      })
      .eq('ma_voucher_code', ma_voucher_code)
      .select()
      .single();

    if (error || !data) {
      throw new BadRequestException('Không thể cập nhật trạng thái mã voucher');
    }

    if (userId) {
      await this.supabase.writeLog(userId, `Xác nhận sử dụng mã voucher: ${ma_voucher_code} tại chi nhánh: ${ma_cn}`);
    }

    return {
      success: true,
      data,
      message: 'Xác nhận sử dụng voucher thành công',
    };
  }

  // Lịch sử mua hàng của khách hàng
  async getPurchaseHistory(ma_kh: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('voucher_phat_hanh')
      .select(`
        *,
        voucher(ten_voucher, gia_ban, ngay_kt),
        don_hang(ngay_tao_don, tong_tien)
      `)
      .eq('don_hang.ma_kh', ma_kh)
      .order('ngay_su_dung', { ascending: false });

    if (error) throw new BadRequestException(error.message);

    return {
      success: true,
      data,
      message: 'Lấy lịch sử mua hàng thành công',
    };
  }

  // Thống kê cho Partner (KPI-04)
  async getPartnerStats(ma_dt: string) {
    const { data: vouchers, error } = await this.supabase
      .getClient()
      .from('voucher')
      .select(`
        ma_voucher,
        ten_voucher,
        gia_ban,
        so_luong_phat_hanh,
        so_luong_da_ban,
        trang_thai
      `)
      .eq('ma_dt', ma_dt);

    if (error) throw new BadRequestException(error.message);

    // Tính doanh thu tạm tính
    const tongDoanhThu = vouchers.reduce((sum, v) => {
      return sum + Number(v.gia_ban) * v.so_luong_da_ban;
    }, 0);

    const tongDaBan = vouchers.reduce((sum, v) => sum + v.so_luong_da_ban, 0);

    return {
      success: true,
      data: {
        vouchers,
        tong_da_ban: tongDaBan,
        tong_doanh_thu_tam_tinh: tongDoanhThu,
      },
      message: 'Lấy thống kê đối tác thành công',
    };
  }

  // Thống kê toàn sàn cho Admin (KPI-04)
  async getAdminStats() {
    const { data: vouchers, error } = await this.supabase
      .getClient()
      .from('voucher')
      .select('gia_ban, so_luong_da_ban, trang_thai');

    if (error) throw new BadRequestException(error.message);

    const { data: orders, error: orderError } = await this.supabase
      .getClient()
      .from('don_hang')
      .select('tong_tien, trang_thai_thanh_toan');

    if (orderError) throw new BadRequestException(orderError.message);

    const tongDoanhThu = orders
      .filter((o) => o.trang_thai_thanh_toan === 'thanh_cong') // Phù hợp trạng thái 'thanh_cong'
      .reduce((sum, o) => sum + Number(o.tong_tien), 0);

    const tongVoucherDaBan = vouchers.reduce((sum, v) => sum + v.so_luong_da_ban, 0);

    return {
      success: true,
      data: {
        tong_voucher_da_ban: tongVoucherDaBan,
        tong_don_hang: orders.length,
        tong_doanh_thu: tongDoanhThu,
      },
      message: 'Lấy thống kê toàn sàn thành công',
    };
  }
}
