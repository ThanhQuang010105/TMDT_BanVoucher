import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrdersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // Helper: Xác thực token và lấy ma_kh của khách hàng
  private async getKhachHang(accessToken: string) {
    const client = this.supabaseService.getClient();
    const { data: { user }, error } = await client.auth.getUser(accessToken);
    if (error || !user) throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn.');

    const { data: kh } = await client
      .from('khach_hang')
      .select('ma_kh')
      .eq('ma_tk', user.id)
      .single();

    if (!kh) throw new NotFoundException('Không tìm thấy thông tin khách hàng.');
    return kh.ma_kh as string;
  }

  // ─── GIỎ HÀNG: XEM ──────────────────────────────────────────────────────────
  async getCart(accessToken: string) {
    const client = this.supabaseService.getClient();
    const maKh = await this.getKhachHang(accessToken);

    const { data, error } = await client
      .from('chi_tiet_gio_hang')
      .select(`
        ma_ctgh, so_luong_mua,
        voucher ( ma_voucher, ten_voucher, gia_goc, gia_ban, ngay_kt, so_luong_phat_hanh, so_luong_da_ban )
      `)
      .eq('ma_kh', maKh);

    if (error) throw new InternalServerErrorException(error.message);

    // Tính tổng tiền giỏ hàng
    const tongTien = (data ?? []).reduce((sum: number, item: any) => {
      return sum + (item.voucher?.gia_ban ?? 0) * item.so_luong_mua;
    }, 0);

    return { data: data ?? [], tong_tien: tongTien };
  }

  // ─── GIỎ HÀNG: THÊM ─────────────────────────────────────────────────────────
  async addToCart(accessToken: string, dto: AddToCartDto) {
    const client = this.supabaseService.getClient();
    const maKh = await this.getKhachHang(accessToken);
    const now = new Date().toISOString();

    // Kiểm tra voucher hợp lệ và còn hàng
    const { data: voucher } = await client
      .from('voucher')
      .select('ma_voucher, so_luong_phat_hanh, so_luong_da_ban, ngay_kt, trang_thai')
      .eq('ma_voucher', dto.ma_voucher)
      .single();

    if (!voucher) throw new NotFoundException('Voucher không tồn tại.');
    if (voucher.trang_thai !== 'active') throw new BadRequestException('Voucher không còn hoạt động.');
    if (voucher.ngay_kt < now) throw new BadRequestException('Voucher đã hết hạn bán.');

    const conLai = voucher.so_luong_phat_hanh - voucher.so_luong_da_ban;
    if (conLai <= 0) throw new BadRequestException('Voucher đã hết số lượng.');

    // Kiểm tra xem item đã trong giỏ chưa, nếu rồi thì cập nhật số lượng
    const { data: existing } = await client
      .from('chi_tiet_gio_hang')
      .select('ma_ctgh, so_luong_mua')
      .eq('ma_kh', maKh)
      .eq('ma_voucher', dto.ma_voucher)
      .single();

    if (existing) {
      const newQty = existing.so_luong_mua + dto.so_luong_mua;
      if (newQty > conLai) throw new BadRequestException(`Chỉ còn ${conLai} voucher trong kho.`);

      const { error } = await client
        .from('chi_tiet_gio_hang')
        .update({ so_luong_mua: newQty })
        .eq('ma_ctgh', existing.ma_ctgh);

      if (error) throw new InternalServerErrorException(error.message);
      return { message: 'Đã cập nhật số lượng trong giỏ hàng.' };
    }

    // Thêm mới vào giỏ
    if (dto.so_luong_mua > conLai) throw new BadRequestException(`Chỉ còn ${conLai} voucher trong kho.`);

    const { error } = await client.from('chi_tiet_gio_hang').insert({
      ma_ctgh: `GH-${uuidv4().slice(0, 8).toUpperCase()}`,
      ma_kh: maKh,
      ma_voucher: dto.ma_voucher,
      so_luong_mua: dto.so_luong_mua,
    });

    if (error) throw new InternalServerErrorException(error.message);
    return { message: 'Thêm vào giỏ hàng thành công.' };
  }

  // ─── GIỎ HÀNG: XÓA ──────────────────────────────────────────────────────────
  async removeFromCart(accessToken: string, maCtgh: string) {
    const client = this.supabaseService.getClient();
    const maKh = await this.getKhachHang(accessToken);

    const { error } = await client
      .from('chi_tiet_gio_hang')
      .delete()
      .eq('ma_ctgh', maCtgh)
      .eq('ma_kh', maKh); // Bảo đảm chỉ xóa item của chính khách hàng đó

    if (error) throw new InternalServerErrorException(error.message);
    return { message: 'Đã xóa khỏi giỏ hàng.' };
  }

  // ─── TẠO ĐƠN HÀNG & THANH TOÁN MÔ PHỎNG ────────────────────────────────────
  async createOrder(accessToken: string, dto: CreateOrderDto) {
    const client = this.supabaseService.getClient();
    const maKh = await this.getKhachHang(accessToken);

    // Lấy toàn bộ giỏ hàng
    const { data: cartItems, error: cartError } = await client
      .from('chi_tiet_gio_hang')
      .select(`ma_ctgh, so_luong_mua, ma_voucher, voucher ( gia_ban, so_luong_phat_hanh, so_luong_da_ban, trang_thai, ngay_kt )`)
      .eq('ma_kh', maKh);

    if (cartError) throw new InternalServerErrorException(cartError.message);
    if (!cartItems || cartItems.length === 0) throw new BadRequestException('Giỏ hàng trống.');

    const now = new Date().toISOString();
    let tongTien = 0;
    const validItems: any[] = [];

    // Validate từng item trong giỏ
    for (const item of cartItems) {
      const v = item.voucher as any;
      if (v.trang_thai !== 'active') throw new BadRequestException(`Voucher ${item.ma_voucher} không còn hoạt động.`);
      if (v.ngay_kt < now) throw new BadRequestException(`Voucher ${item.ma_voucher} đã hết hạn bán.`);

      const conLai = v.so_luong_phat_hanh - v.so_luong_da_ban;
      if (item.so_luong_mua > conLai) {
        throw new BadRequestException(`Voucher ${item.ma_voucher} chỉ còn ${conLai} trong kho.`);
      }
      tongTien += v.gia_ban * item.so_luong_mua;
      validItems.push(item);
    }

    // Tạo đơn hàng
    const maDh = `DH-${uuidv4().slice(0, 8).toUpperCase()}`;
    const { error: dhError } = await client.from('don_hang').insert({
      ma_dh: maDh,
      ma_kh: maKh,
      ten_don_hang: dto.ten_don_hang ?? null,
      tong_tien: tongTien,
      phuong_thuc_thanh_toan: dto.phuong_thuc_thanh_toan,
      trang_thai_thanh_toan: 'thanh_cong', // Mô phỏng: thanh toán luôn thành công
    });
    if (dhError) throw new InternalServerErrorException(dhError.message);

    // Tạo chi tiết đơn hàng và phát hành voucher code
    const chiTietList: any[] = [];
    const voucherCodesInsert: any[] = [];

    for (const item of validItems) {
      const v = item.voucher as any;
      const maCtdh = `CTDH-${uuidv4().slice(0, 8).toUpperCase()}`;

      chiTietList.push({
        ma_ctdh: maCtdh,
        ma_dh: maDh,
        ma_voucher: item.ma_voucher,
        so_luong_mua: item.so_luong_mua,
        don_gia_mua: v.gia_ban,
      });

      // Phát hành code voucher duy nhất cho từng lượt mua (RB-06: phải unique & khó đoán)
      for (let i = 0; i < item.so_luong_mua; i++) {
        voucherCodesInsert.push({
          ma_voucher_code: `VC-${uuidv4().slice(0, 12).toUpperCase()}`,
          ma_voucher: item.ma_voucher,
          ma_dh: maDh,
          trang_thai: 'chua_su_dung',
          chuoi_ma_bao_mat: uuidv4().replace(/-/g, ''), // Chuỗi bảo mật 32 ký tự
        });
      }

      // Cập nhật số lượng đã bán (RB-11 & RB-15: kiểm soát tồn kho)
      await client.rpc('increment_so_luong_da_ban', {
        p_ma_voucher: item.ma_voucher,
        p_so_luong: item.so_luong_mua,
      });
    }

    // Insert chi tiết đơn hàng
    const { error: ctdhError } = await client.from('chi_tiet_don_hang').insert(chiTietList);
    if (ctdhError) throw new InternalServerErrorException(ctdhError.message);

    // Phát hành voucher code (RB-05: chỉ phát hành sau khi thanh toán thành công)
    const { error: vcError } = await client.from('voucher_phat_hanh').insert(voucherCodesInsert);
    if (vcError) throw new InternalServerErrorException(vcError.message);

    // Ghi lịch sử giao dịch
    const maLs = `LS-${uuidv4().slice(0, 8).toUpperCase()}`;
    await client.from('lich_su_giao_dich').insert({
      ma_ls: maLs,
      ma_dh: maDh,
      so_tien: tongTien,
      phuong_thuc_thanh_toan: dto.phuong_thuc_thanh_toan,
      trang_thai_thanh_toan: 'thanh_cong',
    });

    // Xóa giỏ hàng sau khi đặt hàng thành công
    await client.from('chi_tiet_gio_hang').delete().eq('ma_kh', maKh);

    return {
      message: 'Đặt hàng và thanh toán thành công.',
      ma_dh: maDh,
      tong_tien: tongTien,
      so_voucher_code_phat_hanh: voucherCodesInsert.length,
    };
  }

  // ─── VÍ VOUCHER (MY VOUCHERS) ────────────────────────────────────────────────
  async getMyVouchers(accessToken: string, trang_thai?: string) {
    const client = this.supabaseService.getClient();
    const maKh = await this.getKhachHang(accessToken);

    // Lấy tất cả đơn hàng của khách hàng
    const { data: orders } = await client
      .from('don_hang')
      .select('ma_dh')
      .eq('ma_kh', maKh)
      .eq('trang_thai_thanh_toan', 'thanh_cong');

    const maDhList = (orders ?? []).map((o: any) => o.ma_dh);
    if (maDhList.length === 0) return { data: [] };

    // Lấy các voucher code đã phát hành
    let query = client
      .from('voucher_phat_hanh')
      .select(`
        ma_voucher_code, trang_thai, ngay_su_dung, chuoi_ma_bao_mat,
        voucher ( ma_voucher, ten_voucher, gia_ban, ngay_kt, doi_tac ( ten_doanh_nghiep ) ),
        don_hang ( ma_dh, ngay_tao_don )
      `)
      .in('ma_dh', maDhList)
      .order('ma_voucher_code', { ascending: false });

    // Lọc theo trạng thái nếu được chỉ định
    if (trang_thai) {
      query = query.eq('trang_thai', trang_thai);
    }

    const { data, error } = await query;
    if (error) throw new InternalServerErrorException(error.message);

    return { data: data ?? [] };
  }

  // ─── CHI TIẾT 1 VOUCHER CODE ─────────────────────────────────────────────────
  async getVoucherCodeDetail(accessToken: string, maVoucherCode: string) {
    const client = this.supabaseService.getClient();
    const maKh = await this.getKhachHang(accessToken);

    const { data: orders } = await client
      .from('don_hang')
      .select('ma_dh')
      .eq('ma_kh', maKh);

    const maDhList = (orders ?? []).map((o: any) => o.ma_dh);

    const { data, error } = await client
      .from('voucher_phat_hanh')
      .select(`
        ma_voucher_code, trang_thai, ngay_su_dung, chuoi_ma_bao_mat,
        voucher ( ma_voucher, ten_voucher, gia_goc, gia_ban, ngay_kt, mo_ta,
          doi_tac ( ten_doanh_nghiep ), chi_nhanh: doi_tac ( chi_nhanh ( ten_chi_nhanh, dia_chi ) ) ),
        don_hang ( ma_dh, ngay_tao_don, phuong_thuc_thanh_toan )
      `)
      .eq('ma_voucher_code', maVoucherCode)
      .in('ma_dh', maDhList)
      .single();

    if (error || !data) {
      throw new NotFoundException('Không tìm thấy voucher code hoặc không có quyền truy cập.');
    }

    return { data };
  }

  // ─── ĐÁNH GIÁ VOUCHER ───────────────────────────────────────────────────────
  async createReview(accessToken: string, dto: CreateReviewDto) {
    const client = this.supabaseService.getClient();
    const maKh = await this.getKhachHang(accessToken);

    // RB-10: Chỉ được đánh giá sau khi đã mua và đã sử dụng (trang_thai = 'da_su_dung')
    const { data: orders } = await client
      .from('don_hang')
      .select('ma_dh')
      .eq('ma_kh', maKh);

    const maDhList = (orders ?? []).map((o: any) => o.ma_dh);

    const { data: usedCode } = await client
      .from('voucher_phat_hanh')
      .select('ma_voucher_code')
      .eq('ma_voucher', dto.ma_voucher)
      .eq('trang_thai', 'da_su_dung')
      .in('ma_dh', maDhList)
      .limit(1)
      .single();

    if (!usedCode) {
      throw new ForbiddenException('Bạn chỉ có thể đánh giá voucher sau khi đã sử dụng.');
    }

    // Kiểm tra đã đánh giá chưa
    const { data: existing } = await client
      .from('danh_gia')
      .select('ma_dg')
      .eq('ma_kh', maKh)
      .eq('ma_voucher', dto.ma_voucher)
      .single();

    if (existing) throw new ConflictException('Bạn đã đánh giá voucher này rồi.');

    const maDg = `DG-${uuidv4().slice(0, 8).toUpperCase()}`;
    const { error } = await client.from('danh_gia').insert({
      ma_dg: maDg,
      ma_kh: maKh,
      ma_voucher: dto.ma_voucher,
      diem_so_dg: dto.diem_so_dg,
      noi_dung_binh_luan: dto.noi_dung_binh_luan ?? null,
    });

    if (error) throw new InternalServerErrorException(error.message);

    return { message: 'Cảm ơn bạn đã đánh giá!', ma_dg: maDg };
  }

  // ─── LỊCH SỬ ĐƠN HÀNG ──────────────────────────────────────────────────────
  async getOrderHistory(accessToken: string) {
    const client = this.supabaseService.getClient();
    const maKh = await this.getKhachHang(accessToken);

    const { data, error } = await client
      .from('don_hang')
      .select(`
        ma_dh, ten_don_hang, tong_tien, phuong_thuc_thanh_toan,
        trang_thai_thanh_toan, ngay_tao_don,
        chi_tiet_don_hang ( so_luong_mua, don_gia_mua,
          voucher ( ten_voucher ) )
      `)
      .eq('ma_kh', maKh)
      .order('ngay_tao_don', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return { data: data ?? [] };
  }
}
