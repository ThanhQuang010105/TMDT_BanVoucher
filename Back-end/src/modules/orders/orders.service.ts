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
import { CreateComplaintDto } from './dto/create-complaint.dto';
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
        voucher ( ma_voucher, ten_voucher, gia_goc, gia_ban, ngay_kt, so_luong_phat_hanh, so_luong_da_ban, link_voucher_banner )
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
        voucher ( ma_voucher, ten_voucher, gia_ban, ngay_kt, link_voucher_banner, doi_tac ( ten_doanh_nghiep ) ),
        don_hang ( ma_dh, ngay_tao_don )
      `)
      .in('ma_dh', maDhList);

    // Lọc theo trạng thái nếu được chỉ định
    if (trang_thai) {
      query = query.eq('trang_thai', trang_thai);
    }

    const { data, error } = await query;
    if (error) throw new InternalServerErrorException(error.message);

    // Sắp xếp in-memory:
    // 1. Voucher mới mua lên đầu (ngay_tao_don giảm dần)
    // 2. Hai voucher giống nhau thì đứng cạnh nhau (ma_voucher)
    const sortedData = (data ?? []).sort((a: any, b: any) => {
      const dateA = new Date(a.don_hang?.ngay_tao_don || 0).getTime();
      const dateB = new Date(b.don_hang?.ngay_tao_don || 0).getTime();
      if (dateB !== dateA) {
        return dateB - dateA;
      }
      const vA = a.voucher?.ma_voucher || '';
      const vB = b.voucher?.ma_voucher || '';
      return vA.localeCompare(vB);
    });

    return { data: sortedData };
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
        voucher ( ma_voucher, ten_voucher, gia_goc, gia_ban, ngay_kt, mo_ta, link_voucher_banner,
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

  // ─── HỦY ĐƠN HÀNG & HOÀN TIỀN (BR-ADM-04, RB-13) ─────────────────────────────
  async cancelOrder(accessToken: string, maDh: string) {
    const client = this.supabaseService.getClient();

    // 1. Xác thực người dùng và phân quyền
    const { data: { user }, error: authError } = await client.auth.getUser(accessToken);
    if (authError || !user) throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn.');

    const { data: taiKhoan } = await client
      .from('tai_khoan')
      .select('vai_tro')
      .eq('ma_tk', user.id)
      .single();

    const isAdmin = taiKhoan?.vai_tro === 'admin';

    // Lấy thông tin đơn hàng
    const { data: order, error: orderError } = await client
      .from('don_hang')
      .select('*')
      .eq('ma_dh', maDh)
      .single();

    if (orderError || !order) throw new NotFoundException('Đơn hàng không tồn tại.');

    // Nếu không phải admin, kiểm tra xem đơn hàng có phải của khách hàng này không
    if (!isAdmin) {
      const { data: kh } = await client
        .from('khach_hang')
        .select('ma_kh')
        .eq('ma_tk', user.id)
        .single();

      if (!kh || order.ma_kh !== kh.ma_kh) {
        throw new ForbiddenException('Bạn không có quyền hủy đơn hàng này.');
      }
    }

    if (order.trang_thai_thanh_toan === 'da_huy') {
      throw new BadRequestException('Đơn hàng đã được hủy trước đó.');
    }

    // 2. Kiểm tra xem có voucher code nào của đơn này đã sử dụng chưa
    const { data: voucherCodes, error: vcError } = await client
      .from('voucher_phat_hanh')
      .select('*')
      .eq('ma_dh', maDh);

    if (vcError) throw new InternalServerErrorException(vcError.message);

    const hasUsedCode = (voucherCodes ?? []).some((vc: any) => vc.trang_thai === 'da_su_dung');
    if (hasUsedCode) {
      throw new BadRequestException('Không thể hủy đơn hàng do đã có mã voucher được sử dụng.');
    }

    // 3. Cập nhật trạng thái đơn hàng thành 'da_huy'
    const { error: updateOrderError } = await client
      .from('don_hang')
      .update({ trang_thai_thanh_toan: 'da_huy' })
      .eq('ma_dh', maDh);

    if (updateOrderError) throw new InternalServerErrorException(updateOrderError.message);

    // 4. Thu hồi mã voucher phát hành (chuyển sang 'da_huy')
    const { error: updateVcError } = await client
      .from('voucher_phat_hanh')
      .update({ trang_thai: 'da_huy' })
      .eq('ma_dh', maDh);

    if (updateVcError) throw new InternalServerErrorException(updateVcError.message);

    // 5. Hoàn lại số lượng tồn kho voucher (giảm so_luong_da_ban)
    const { data: orderDetails } = await client
      .from('chi_tiet_don_hang')
      .select('ma_voucher, so_luong_mua')
      .eq('ma_dh', maDh);

    for (const detail of orderDetails ?? []) {
      const { data: v } = await client
        .from('voucher')
        .select('so_luong_da_ban')
        .eq('ma_voucher', detail.ma_voucher)
        .single();

      if (v) {
        await client
          .from('voucher')
          .update({
            so_luong_da_ban: Math.max(0, v.so_luong_da_ban - detail.so_luong_mua),
          })
          .eq('ma_voucher', detail.ma_voucher);
      }
    }

    // 6. Ghi nhận giao dịch hoàn tiền âm vào lich_su_giao_dich
    const maLs = `LS-REFUND-${uuidv4().slice(0, 8).toUpperCase()}`;
    const { error: refundError } = await client.from('lich_su_giao_dich').insert({
      ma_ls: maLs,
      ma_dh: maDh,
      so_tien: -Number(order.tong_tien),
      phuong_thuc_thanh_toan: order.phuong_thuc_thanh_toan,
      trang_thai_thanh_toan: 'hoan_tien',
    });

    if (refundError) throw new InternalServerErrorException(refundError.message);

    // Ghi nhật ký hệ thống
    await this.supabaseService.writeLog(user.id, `Hủy đơn hàng và hoàn tiền: ${maDh}`);

    return {
      success: true,
      message: 'Hủy đơn hàng và hoàn tiền thành công.',
      ma_ls: maLs,
    };
  }

  // ─── GỬI KHIẾU NẠI (BR-CUS-08) ──────────────────────────────────────────────
  async createComplaint(accessToken: string, dto: CreateComplaintDto) {
    const client = this.supabaseService.getClient();
    const maKh = await this.getKhachHang(accessToken);

    // Tìm bản ghi voucher_phat_hanh theo ma_voucher_code (mã cụ thể của voucher đó)
    const { data: voucherRecord, error: vcError } = await client
      .from('voucher_phat_hanh')
      .select('ma_voucher_code, ma_voucher, ma_dh')
      .eq('ma_voucher_code', dto.ma_voucher_code)
      .single();

    if (vcError || !voucherRecord) {
      throw new ForbiddenException('Không tìm thấy voucher này.');
    }

    // Xác minh đơn hàng thuộc về khách hàng này
    const { data: order } = await client
      .from('don_hang')
      .select('ma_dh')
      .eq('ma_dh', voucherRecord.ma_dh)
      .eq('ma_kh', maKh)
      .eq('trang_thai_thanh_toan', 'thanh_cong')
      .single();

    if (!order) {
      throw new ForbiddenException('Bạn chỉ có thể khiếu nại các voucher đã mua thành công.');
    }

    const maKN = `KN-${uuidv4().slice(0, 8).toUpperCase()}`;

    const { data, error } = await client
      .from('khieu_nai')
      .insert({
        ma_kn: maKN,
        ma_kh: maKh,
        ma_voucher: voucherRecord.ma_voucher,
        ly_do: dto.ly_do,
        trang_thai_xl: 'pending',
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    return {
      success: true,
      data,
      message: 'Gửi khiếu nại thành công.',
    };
  }

  // ─── XÓA ĐÁNH GIÁ CỦA BẢN THÂN ──────────────────────────────────────────────
  async deleteReview(accessToken: string, maDanhGia: string) {
    const client = this.supabaseService.getClient();
    const maKh = await this.getKhachHang(accessToken);

    // Kiểm tra bình luận thuộc về khách hàng này
    const { data: review, error: findErr } = await client
      .from('danh_gia')
      .select('ma_dg')
      .eq('ma_dg', maDanhGia)
      .eq('ma_kh', maKh)
      .single();

    if (findErr || !review) {
      throw new ForbiddenException('Bạn không có quyền xóa bình luận này.');
    }

    const { error } = await client
      .from('danh_gia')
      .delete()
      .eq('ma_dg', maDanhGia);

    if (error) throw new InternalServerErrorException(error.message);

    return { success: true, message: 'Đã xóa bình luận thành công.' };
  }

  // ─── STRIPE CHECKOUT ─────────────────────────────────────────────────────────

  /** Trả về Stripe Public Key để frontend khởi tạo Stripe.js nếu cần */
  getStripeConfig() {
    return {
      success: true,
      publishableKey: process.env.STRIPE_PUBLIC_KEY,
    };
  }

  /** Tạo Stripe Checkout Session từ những item được chọn trong giỏ hàng */
  async createStripeCheckoutSession(
    accessToken: string,
    emailNhanVoucher?: string,
    maCtghList?: string[], // Danh sách ID item được chọn
  ) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const client = this.supabaseService.getClient();
    const maKh = await this.getKhachHang(accessToken);

    // Lấy giỏ hàng với thông tin voucher
    let query = client
      .from('chi_tiet_gio_hang')
      .select(`ma_ctgh, so_luong_mua, ma_voucher, voucher ( ten_voucher, gia_ban, so_luong_phat_hanh, so_luong_da_ban, trang_thai, ngay_kt, link_voucher_banner )`)
      .eq('ma_kh', maKh);

    // Nếu có danh sách item được chọn, chỉ lấy đúng những item đó
    if (maCtghList && maCtghList.length > 0) {
      query = query.in('ma_ctgh', maCtghList);
    }

    const { data: cartItems, error: cartError } = await query;

    if (cartError) throw new InternalServerErrorException(cartError.message);
    if (!cartItems || cartItems.length === 0) throw new BadRequestException('Giỏ hàng trống.');

    const now = new Date().toISOString();

    // Validate từng item (giống createOrder)
    for (const item of cartItems) {
      const v = item.voucher as any;
      if (v.trang_thai !== 'active') throw new BadRequestException(`Voucher ${item.ma_voucher} không còn hoạt động.`);
      if (v.ngay_kt < now) throw new BadRequestException(`Voucher ${item.ma_voucher} đã hết hạn.`);
      const conLai = v.so_luong_phat_hanh - v.so_luong_da_ban;
      if (item.so_luong_mua > conLai) throw new BadRequestException(`Voucher ${item.ma_voucher} chỉ còn ${conLai} trong kho.`);
    }

    // Tạo line_items cho Stripe (quy đổi VNĐ → USD cents, tỉ giá ~25000)
    const lineItems = cartItems.map((item) => {
      const v = item.voucher as any;
      const unitAmountCents = Math.round((v.gia_ban / 25000) * 100);
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: v.ten_voucher,
            description: `VoucherHub - Thanh toán voucher`,
            ...(v.link_voucher_banner ? { images: [v.link_voucher_banner] } : {}),
          },
          unit_amount: unitAmountCents,
        },
        quantity: item.so_luong_mua,
      };
    });

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

    // Tạo Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${backendUrl}/api/orders/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${backendUrl}/api/orders/stripe/cancel`,
      metadata: {
        ma_kh: maKh,
        email_nhan_voucher: emailNhanVoucher || '',
        // Lưu danh sách ma_ctgh được chọn để dùng khi xử lý success
        ma_ctgh_list: cartItems.map(i => i.ma_ctgh).join(','),
      },
    });

    return { url: session.url as string };
  }

  /** Xác nhận thanh toán Stripe thành công → tạo đơn hàng thật trong DB */
  async handleStripeSuccess(accessToken: string, sessionId: string) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const client = this.supabaseService.getClient();

    // 1. Kiểm tra xem giao dịch này đã được xử lý tạo đơn hàng chưa để tránh trùng lặp
    const { data: existingTx } = await client
      .from('lich_su_giao_dich')
      .select('ma_dh, so_tien')
      .eq('ma_giao_dich_cung_cap', sessionId)
      .maybeSingle();

    if (existingTx) {
      return { ma_dh: existingTx.ma_dh, tong_tien: Number(existingTx.so_tien) };
    }

    // Lấy thông tin phiên từ Stripe
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (stripeSession.payment_status !== 'paid') {
      throw new BadRequestException('Giao dịch chưa hoàn tất.');
    }

    const maKh = stripeSession.metadata?.ma_kh;
    if (!maKh) throw new BadRequestException('Không tìm thấy thông tin khách hàng từ phiên Stripe.');

    // Lấy danh sách ma_ctgh được chọn (lưu trong metadata khi tạo session)
    const maCtghListStr = stripeSession.metadata?.ma_ctgh_list || '';
    const maCtghList = maCtghListStr ? maCtghListStr.split(',').filter(Boolean) : [];

    // Lấy giỏ hàng của khách hàng — chỉ lấy đúng những item được chọn
    let cartQuery = client
      .from('chi_tiet_gio_hang')
      .select(`ma_ctgh, so_luong_mua, ma_voucher, voucher ( gia_ban, so_luong_phat_hanh, so_luong_da_ban, trang_thai, ngay_kt )`)
      .eq('ma_kh', maKh);

    if (maCtghList.length > 0) {
      cartQuery = cartQuery.in('ma_ctgh', maCtghList);
    }

    const { data: cartItems, error: cartError } = await cartQuery;

    if (cartError) throw new InternalServerErrorException(cartError.message);
    if (!cartItems || cartItems.length === 0) throw new BadRequestException('Giỏ hàng trống hoặc đã được xử lý.');

    let tongTien = 0;
    const validItems: any[] = [];

    for (const item of cartItems) {
      const v = item.voucher as any;
      tongTien += v.gia_ban * item.so_luong_mua;
      validItems.push(item);
    }

    // Tạo đơn hàng (giống createOrder)
    const maDh = `DH-${uuidv4().slice(0, 8).toUpperCase()}`;
    const { error: dhError } = await client.from('don_hang').insert({
      ma_dh: maDh,
      ma_kh: maKh,
      tong_tien: tongTien,
      phuong_thuc_thanh_toan: 'the_quoc_te',
      trang_thai_thanh_toan: 'thanh_cong',
    });

    if (dhError) throw new InternalServerErrorException(dhError.message);

    // Tạo chi tiết đơn hàng + chuẩn bị phát hành voucher (y hệt createOrder)
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

      for (let i = 0; i < item.so_luong_mua; i++) {
        voucherCodesInsert.push({
          ma_voucher_code: `VC-${uuidv4().slice(0, 12).toUpperCase()}`,
          ma_voucher: item.ma_voucher,
          ma_dh: maDh,
          trang_thai: 'chua_su_dung',
          chuoi_ma_bao_mat: uuidv4().replace(/-/g, ''),
        });
      }

      // Cập nhật tồn kho qua RPC (giống createOrder)
      await client.rpc('increment_so_luong_da_ban', {
        p_ma_voucher: item.ma_voucher,
        p_so_luong: item.so_luong_mua,
      });
    }

    // Insert chi tiết đơn hàng
    const { error: ctdhError } = await client.from('chi_tiet_don_hang').insert(chiTietList);
    if (ctdhError) throw new InternalServerErrorException(ctdhError.message);

    // Phát hành voucher code — đúng tên bảng: voucher_phat_hanh
    const { error: vcError } = await client.from('voucher_phat_hanh').insert(voucherCodesInsert);
    if (vcError) throw new InternalServerErrorException(vcError.message);

    // Ghi lịch sử giao dịch
    const maLs = `LS-${uuidv4().slice(0, 8).toUpperCase()}`;
    await client.from('lich_su_giao_dich').insert({
      ma_ls: maLs,
      ma_dh: maDh,
      so_tien: tongTien,
      phuong_thuc_thanh_toan: 'the_quoc_te',
      trang_thai_thanh_toan: 'thanh_cong',
      ma_giao_dich_cung_cap: sessionId,
    });

    // Chỉ xóa những item đã thanh toán ra khỏi giỏ hàng
    if (maCtghList.length > 0) {
      await client.from('chi_tiet_gio_hang').delete().in('ma_ctgh', maCtghList);
    } else {
      await client.from('chi_tiet_gio_hang').delete().eq('ma_kh', maKh);
    }

    return { ma_dh: maDh, tong_tien: tongTien };
  }
}
