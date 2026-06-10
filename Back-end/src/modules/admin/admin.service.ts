import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class AdminService {
  constructor(private supabase: SupabaseService) {}

  async getAllUsers() {
    const client = this.supabase.getClient();
    const { data: authData, error } = await client.auth.admin.listUsers();
    if (error) throw new BadRequestException(error.message);

    const { data: dbUsers, error: dbError } = await client
      .from('tai_khoan')
      .select('ma_tk, vai_tro, trang_thai_hoat_dong');

    const dbUsersMap = new Map((dbUsers || []).map(u => [u.ma_tk, u]));

    const users = authData.users.map(u => {
      const dbUser = dbUsersMap.get(u.id);
      return {
        ...u,
        db_role: dbUser?.vai_tro || null,
        db_status: dbUser?.trang_thai_hoat_dong || null,
      };
    });

    return { success: true, data: users, message: 'Lấy danh sách user thành công' };
  }

  async banUser(userId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .auth.admin.updateUserById(userId, { ban_duration: '876600h' });
    if (error) throw new NotFoundException(error.message);

    // Đồng bộ trạng thái khóa tài khoản sang bảng tai_khoan
    await this.supabase
      .getClient()
      .from('tai_khoan')
      .update({ trang_thai_hoat_dong: 'banned' })
      .eq('ma_tk', userId);

    return { success: true, data, message: 'Khóa tài khoản thành công' };
  }

  async unbanUser(userId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .auth.admin.updateUserById(userId, { ban_duration: 'none' });
    if (error) throw new NotFoundException(error.message);

    // Đồng bộ trạng thái mở khóa tài khoản sang bảng tai_khoan
    await this.supabase
      .getClient()
      .from('tai_khoan')
      .update({ trang_thai_hoat_dong: 'active' })
      .eq('ma_tk', userId);

    return { success: true, data, message: 'Mở khóa tài khoản thành công' };
  }

  async deleteUser(userId: string) {
    const client = this.supabase.getClient();

    // 1. Xóa hồ sơ khách hàng/đối tác trước do ràng buộc khóa ngoại
    await client.from('khach_hang').delete().eq('ma_tk', userId);
    await client.from('doi_tac').delete().eq('ma_tk', userId);

    // 2. Xóa tài khoản trong DB
    const { error: dbError } = await client
      .from('tai_khoan')
      .delete()
      .eq('ma_tk', userId);

    // 3. Xóa user trên Supabase Auth
    await client.auth.admin.deleteUser(userId);

    if (dbError) throw new BadRequestException(dbError.message);

    return { success: true, message: 'Xóa tài khoản thành công' };
  }

  async getPendingVouchers() {
    const { data, error } = await this.supabase
      .getClient()
      .from('voucher')
      .select('*, doi_tac(ten_doanh_nghiep)')
      .eq('trang_thai', 'pending');
    if (error) throw new BadRequestException(error.message);
    return { success: true, data, message: 'Lấy danh sách voucher chờ duyệt thành công' };
  }

  async approveVoucher(voucherId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('voucher')
      .update({ trang_thai: 'active' })
      .eq('ma_voucher', voucherId)
      .eq('trang_thai', 'pending')
      .select()
      .single();
    if (error || !data) throw new NotFoundException('Voucher không tồn tại hoặc không ở trạng thái pending');
    return { success: true, data, message: 'Duyệt voucher thành công' };
  }

  async rejectVoucher(voucherId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('voucher')
      .update({ trang_thai: 'rejected' })
      .eq('ma_voucher', voucherId)
      .eq('trang_thai', 'pending')
      .select()
      .single();
    if (error || !data) throw new NotFoundException('Voucher không tồn tại hoặc không ở trạng thái pending');
    return { success: true, data, message: 'Từ chối voucher thành công' };
  }

  async hideVoucher(voucherId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('voucher')
      .update({ trang_thai: 'inactive' })
      .eq('ma_voucher', voucherId)
      .select()
      .single();
    if (error || !data) throw new NotFoundException('Voucher không tồn tại');
    return { success: true, data, message: 'Đã ẩn voucher thành công' };
  }

  async activateVoucher(voucherId: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('voucher')
      .update({ trang_thai: 'active' })
      .eq('ma_voucher', voucherId)
      .select()
      .single();
    if (error || !data) throw new NotFoundException('Voucher không tồn tại');
    return { success: true, data, message: 'Đã hiển thị lại voucher thành công' };
  }

  async deleteVoucher(voucherId: string) {
    const client = this.supabase.getClient();

    // Lấy thông tin banner để xóa file lưu trữ nếu có
    const { data: voucher } = await client
      .from('voucher')
      .select('link_voucher_banner')
      .eq('ma_voucher', voucherId)
      .single();

    if (voucher?.link_voucher_banner) {
      const parts = voucher.link_voucher_banner.split('/storage/v1/object/public/images/');
      const oldPath = parts[1] || null;
      if (oldPath) {
        await client.storage.from('images').remove([oldPath]);
      }
    }

    // 1. Xóa chi tiết giỏ hàng đang tham chiếu voucher này
    await client.from('chi_tiet_gio_hang').delete().eq('ma_voucher', voucherId);

    // 2. Xóa các mã voucher đã phát hành (chi_tiet_don_hang sẽ cascade qua ma_dh)
    //    Trước tiên xóa voucher_phat_hanh (có FK → chi_tiet_don_hang.ma_dh và voucher)
    await client.from('voucher_phat_hanh').delete().eq('ma_voucher', voucherId);

    // 3. Xóa các bản ghi chi_tiet_don_hang liên quan
    await client.from('chi_tiet_don_hang').delete().eq('ma_voucher', voucherId);

    // 4. Xóa danh sách đánh giá, khiếu nại liên quan
    await client.from('danh_gia').delete().eq('ma_voucher', voucherId);
    await client.from('khieu_nai').delete().eq('ma_voucher', voucherId);

    // 5. Xóa ánh xạ chi nhánh và điều kiện áp dụng
    await client.from('voucher_chi_nhanh').delete().eq('ma_voucher', voucherId);
    await client.from('dieu_kien_ap_dung').delete().eq('ma_voucher', voucherId);

    // 6. Cuối cùng mới xóa bản ghi voucher chính
    const { error } = await client
      .from('voucher')
      .delete()
      .eq('ma_voucher', voucherId);

    if (error) throw new BadRequestException(error.message);
    return { success: true, message: 'Đã gỡ bỏ voucher thành công' };
  }

  // ─── PHÊ DUYỆT ĐỐI TÁC (BR-PAR-01, BR-ADM-02) ───────────────────────────────

  async getPendingPartners() {
    const { data, error } = await this.supabase
      .getClient()
      .from('doi_tac')
      .select('*')
      .eq('trang_thai_duyet', 'pending');
    if (error) throw new BadRequestException(error.message);
    return { success: true, data, message: 'Lấy danh sách đối tác chờ duyệt thành công' };
  }

  async approvePartner(maDT: string) {
    const client = this.supabase.getClient();
    const { data: partner, error: findError } = await client
      .from('doi_tac')
      .select('*')
      .eq('ma_dt', maDT)
      .single();

    if (findError || !partner) throw new NotFoundException('Không tìm thấy đối tác');

    const { error: dtError } = await client
      .from('doi_tac')
      .update({ trang_thai_duyet: 'approved' })
      .eq('ma_dt', maDT);

    if (dtError) throw new BadRequestException(dtError.message);

    await client
      .from('tai_khoan')
      .update({ trang_thai_hoat_dong: 'active' })
      .eq('ma_tk', partner.ma_tk);

    await this.supabase.writeLog(partner.ma_tk, `Phê duyệt hồ sơ đối tác: ${partner.ten_doanh_nghiep}`);

    return { success: true, message: 'Phê duyệt đối tác thành công' };
  }

  async rejectPartner(maDT: string) {
    const client = this.supabase.getClient();
    const { data: partner, error: findError } = await client
      .from('doi_tac')
      .select('*')
      .eq('ma_dt', maDT)
      .single();

    if (findError || !partner) throw new NotFoundException('Không tìm thấy đối tác');

    const { error: dtError } = await client
      .from('doi_tac')
      .update({ trang_thai_duyet: 'rejected' })
      .eq('ma_dt', maDT);

    if (dtError) throw new BadRequestException(dtError.message);

    await this.supabase.writeLog(partner.ma_tk, `Từ chối duyệt hồ sơ đối tác: ${partner.ten_doanh_nghiep}`);

    return { success: true, message: 'Từ chối duyệt đối tác thành công' };
  }

  async lockPartner(maDT: string) {
    const client = this.supabase.getClient();
    const { data: partner, error: findError } = await client
      .from('doi_tac')
      .select('ma_tk, ten_doanh_nghiep')
      .eq('ma_dt', maDT)
      .single();

    if (findError || !partner) throw new NotFoundException('Không tìm thấy đối tác');

    await this.banUser(partner.ma_tk);
    await this.supabase.writeLog(partner.ma_tk, `Khóa tài khoản đối tác: ${partner.ten_doanh_nghiep}`);

    return { success: true, message: 'Khóa đối tác thành công' };
  }

  async unlockPartner(maDT: string) {
    const client = this.supabase.getClient();
    const { data: partner, error: findError } = await client
      .from('doi_tac')
      .select('ma_tk, ten_doanh_nghiep')
      .eq('ma_dt', maDT)
      .single();

    if (findError || !partner) throw new NotFoundException('Không tìm thấy đối tác');

    await this.unbanUser(partner.ma_tk);
    await this.supabase.writeLog(partner.ma_tk, `Mở khóa tài khoản đối tác: ${partner.ten_doanh_nghiep}`);

    return { success: true, message: 'Mở khóa đối tác thành công' };
  }

  // ─── QUẢN LÝ KHIẾU NẠI (BR-CUS-08) ──────────────────────────────────────────

  async getAllComplaints() {
    const { data, error } = await this.supabase
      .getClient()
      .from('khieu_nai')
      .select('*, khach_hang(ho_ten), voucher(ten_voucher)')
      .order('ma_kn', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return { success: true, data };
  }

  async resolveComplaint(maKN: string, ketQuaXL: string) {
    const { data, error } = await this.supabase
      .getClient()
      .from('khieu_nai')
      .update({
        trang_thai_xl: 'resolved',
        ket_qua_xl: ketQuaXL,
      })
      .eq('ma_kn', maKN)
      .select()
      .single();

    if (error || !data) throw new NotFoundException('Không tìm thấy khiếu nại');

    return { success: true, data, message: 'Xử lý khiếu nại thành công' };
  }

  // ─── NHẬT KÝ HỆ THỐNG (BR-ADM-07) ───────────────────────────────────────────

  async getSystemLogs() {
    const { data, error } = await this.supabase
      .getClient()
      .from('nhat_ky_he_thong')
      .select('*, tai_khoan(username, vai_tro)')
      .order('thoi_gian', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return { success: true, data };
  }

  async getAllOrders() {
    const { data, error } = await this.supabase
      .getClient()
      .from('don_hang')
      .select('*, khach_hang(ho_ten, email)')
      .order('ngay_tao_don', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    return { success: true, data, message: 'Lấy danh sách đơn hàng thành công' };
  }

  async getDashboardStats() {
    const client = this.supabase.getClient();

    const { data: orders, error: ordersError } = await client
      .from('don_hang')
      .select('tong_tien, trang_thai_thanh_toan, ngay_tao_don');
    if (ordersError) throw new BadRequestException(ordersError.message);

    const successfulOrders = (orders || []).filter(o => 
      o.trang_thai_thanh_toan === 'thanh_cong' || 
      o.trang_thai_thanh_toan === 'completed' || 
      o.trang_thai_thanh_toan === 'Hoàn thành' || 
      o.trang_thai_thanh_toan === 'success'
    );
    const totalRevenue = successfulOrders.reduce((sum, o) => sum + Number(o.tong_tien || 0), 0);

    const { count: usersCount, error: usersError } = await client
      .from('tai_khoan')
      .select('*', { count: 'exact', head: true });
    if (usersError) throw new BadRequestException(usersError.message);

    const { count: vouchersCount, error: vouchersError } = await client
      .from('voucher')
      .select('*', { count: 'exact', head: true });
    if (vouchersError) throw new BadRequestException(vouchersError.message);

    const revenue7Days = Array(7).fill(0).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return {
        dateStr: d.toLocaleDateString('vi-VN', { weekday: 'short' }),
        dateKey: d.toISOString().split('T')[0],
        value: 0
      };
    }).reverse();

    successfulOrders.forEach(o => {
      const orderDate = new Date(o.ngay_tao_don).toISOString().split('T')[0];
      const match = revenue7Days.find(r => r.dateKey === orderDate);
      if (match) {
        match.value += Number(o.tong_tien || 0);
      }
    });

    return {
      success: true,
      data: {
        totalRevenue,
        usersCount: usersCount || 0,
        vouchersCount: vouchersCount || 0,
        ordersCount: orders?.length || 0,
        revenueChart: revenue7Days.map(r => ({ label: r.dateStr, value: r.value }))
      }
    };
  }
}

