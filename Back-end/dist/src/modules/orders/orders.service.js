"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../supabase/supabase.service");
const uuid_1 = require("uuid");
let OrdersService = class OrdersService {
    supabaseService;
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async getKhachHang(accessToken) {
        const client = this.supabaseService.getClient();
        const { data: { user }, error } = await client.auth.getUser(accessToken);
        if (error || !user)
            throw new common_1.UnauthorizedException('Token không hợp lệ hoặc đã hết hạn.');
        const { data: kh } = await client
            .from('khach_hang')
            .select('ma_kh')
            .eq('ma_tk', user.id)
            .single();
        if (!kh)
            throw new common_1.NotFoundException('Không tìm thấy thông tin khách hàng.');
        return kh.ma_kh;
    }
    async getCart(accessToken) {
        const client = this.supabaseService.getClient();
        const maKh = await this.getKhachHang(accessToken);
        const { data, error } = await client
            .from('chi_tiet_gio_hang')
            .select(`
        ma_ctgh, so_luong_mua,
        voucher ( ma_voucher, ten_voucher, gia_goc, gia_ban, ngay_kt, so_luong_phat_hanh, so_luong_da_ban, link_voucher_banner )
      `)
            .eq('ma_kh', maKh);
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        const tongTien = (data ?? []).reduce((sum, item) => {
            return sum + (item.voucher?.gia_ban ?? 0) * item.so_luong_mua;
        }, 0);
        return { data: data ?? [], tong_tien: tongTien };
    }
    async addToCart(accessToken, dto) {
        const client = this.supabaseService.getClient();
        const maKh = await this.getKhachHang(accessToken);
        const now = new Date().toISOString();
        const { data: voucher } = await client
            .from('voucher')
            .select('ma_voucher, so_luong_phat_hanh, so_luong_da_ban, ngay_kt, trang_thai')
            .eq('ma_voucher', dto.ma_voucher)
            .single();
        if (!voucher)
            throw new common_1.NotFoundException('Voucher không tồn tại.');
        if (voucher.trang_thai !== 'active')
            throw new common_1.BadRequestException('Voucher không còn hoạt động.');
        if (voucher.ngay_kt < now)
            throw new common_1.BadRequestException('Voucher đã hết hạn bán.');
        const conLai = voucher.so_luong_phat_hanh - voucher.so_luong_da_ban;
        if (conLai <= 0)
            throw new common_1.BadRequestException('Voucher đã hết số lượng.');
        const { data: existing } = await client
            .from('chi_tiet_gio_hang')
            .select('ma_ctgh, so_luong_mua')
            .eq('ma_kh', maKh)
            .eq('ma_voucher', dto.ma_voucher)
            .single();
        if (existing) {
            const newQty = existing.so_luong_mua + dto.so_luong_mua;
            if (newQty > conLai)
                throw new common_1.BadRequestException(`Chỉ còn ${conLai} voucher trong kho.`);
            const { error } = await client
                .from('chi_tiet_gio_hang')
                .update({ so_luong_mua: newQty })
                .eq('ma_ctgh', existing.ma_ctgh);
            if (error)
                throw new common_1.InternalServerErrorException(error.message);
            return { message: 'Đã cập nhật số lượng trong giỏ hàng.' };
        }
        if (dto.so_luong_mua > conLai)
            throw new common_1.BadRequestException(`Chỉ còn ${conLai} voucher trong kho.`);
        const { error } = await client.from('chi_tiet_gio_hang').insert({
            ma_ctgh: `GH-${(0, uuid_1.v4)().slice(0, 8).toUpperCase()}`,
            ma_kh: maKh,
            ma_voucher: dto.ma_voucher,
            so_luong_mua: dto.so_luong_mua,
        });
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return { message: 'Thêm vào giỏ hàng thành công.' };
    }
    async removeFromCart(accessToken, maCtgh) {
        const client = this.supabaseService.getClient();
        const maKh = await this.getKhachHang(accessToken);
        const { error } = await client
            .from('chi_tiet_gio_hang')
            .delete()
            .eq('ma_ctgh', maCtgh)
            .eq('ma_kh', maKh);
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return { message: 'Đã xóa khỏi giỏ hàng.' };
    }
    async createOrder(accessToken, dto) {
        const client = this.supabaseService.getClient();
        const maKh = await this.getKhachHang(accessToken);
        const { data: cartItems, error: cartError } = await client
            .from('chi_tiet_gio_hang')
            .select(`ma_ctgh, so_luong_mua, ma_voucher, voucher ( gia_ban, so_luong_phat_hanh, so_luong_da_ban, trang_thai, ngay_kt )`)
            .eq('ma_kh', maKh);
        if (cartError)
            throw new common_1.InternalServerErrorException(cartError.message);
        if (!cartItems || cartItems.length === 0)
            throw new common_1.BadRequestException('Giỏ hàng trống.');
        const now = new Date().toISOString();
        let tongTien = 0;
        const validItems = [];
        for (const item of cartItems) {
            const v = item.voucher;
            if (v.trang_thai !== 'active')
                throw new common_1.BadRequestException(`Voucher ${item.ma_voucher} không còn hoạt động.`);
            if (v.ngay_kt < now)
                throw new common_1.BadRequestException(`Voucher ${item.ma_voucher} đã hết hạn bán.`);
            const conLai = v.so_luong_phat_hanh - v.so_luong_da_ban;
            if (item.so_luong_mua > conLai) {
                throw new common_1.BadRequestException(`Voucher ${item.ma_voucher} chỉ còn ${conLai} trong kho.`);
            }
            tongTien += v.gia_ban * item.so_luong_mua;
            validItems.push(item);
        }
        const maDh = `DH-${(0, uuid_1.v4)().slice(0, 8).toUpperCase()}`;
        const { error: dhError } = await client.from('don_hang').insert({
            ma_dh: maDh,
            ma_kh: maKh,
            ten_don_hang: dto.ten_don_hang ?? null,
            tong_tien: tongTien,
            phuong_thuc_thanh_toan: dto.phuong_thuc_thanh_toan,
            trang_thai_thanh_toan: 'thanh_cong',
        });
        if (dhError)
            throw new common_1.InternalServerErrorException(dhError.message);
        const chiTietList = [];
        const voucherCodesInsert = [];
        for (const item of validItems) {
            const v = item.voucher;
            const maCtdh = `CTDH-${(0, uuid_1.v4)().slice(0, 8).toUpperCase()}`;
            chiTietList.push({
                ma_ctdh: maCtdh,
                ma_dh: maDh,
                ma_voucher: item.ma_voucher,
                so_luong_mua: item.so_luong_mua,
                don_gia_mua: v.gia_ban,
            });
            for (let i = 0; i < item.so_luong_mua; i++) {
                voucherCodesInsert.push({
                    ma_voucher_code: `VC-${(0, uuid_1.v4)().slice(0, 12).toUpperCase()}`,
                    ma_voucher: item.ma_voucher,
                    ma_dh: maDh,
                    trang_thai: 'chua_su_dung',
                    chuoi_ma_bao_mat: (0, uuid_1.v4)().replace(/-/g, ''),
                });
            }
            await client.rpc('increment_so_luong_da_ban', {
                p_ma_voucher: item.ma_voucher,
                p_so_luong: item.so_luong_mua,
            });
        }
        const { error: ctdhError } = await client.from('chi_tiet_don_hang').insert(chiTietList);
        if (ctdhError)
            throw new common_1.InternalServerErrorException(ctdhError.message);
        const { error: vcError } = await client.from('voucher_phat_hanh').insert(voucherCodesInsert);
        if (vcError)
            throw new common_1.InternalServerErrorException(vcError.message);
        const maLs = `LS-${(0, uuid_1.v4)().slice(0, 8).toUpperCase()}`;
        await client.from('lich_su_giao_dich').insert({
            ma_ls: maLs,
            ma_dh: maDh,
            so_tien: tongTien,
            phuong_thuc_thanh_toan: dto.phuong_thuc_thanh_toan,
            trang_thai_thanh_toan: 'thanh_cong',
        });
        await client.from('chi_tiet_gio_hang').delete().eq('ma_kh', maKh);
        return {
            message: 'Đặt hàng và thanh toán thành công.',
            ma_dh: maDh,
            tong_tien: tongTien,
            so_voucher_code_phat_hanh: voucherCodesInsert.length,
        };
    }
    async getMyVouchers(accessToken, trang_thai) {
        const client = this.supabaseService.getClient();
        const maKh = await this.getKhachHang(accessToken);
        const { data: orders } = await client
            .from('don_hang')
            .select('ma_dh')
            .eq('ma_kh', maKh)
            .eq('trang_thai_thanh_toan', 'thanh_cong');
        const maDhList = (orders ?? []).map((o) => o.ma_dh);
        if (maDhList.length === 0)
            return { data: [] };
        let query = client
            .from('voucher_phat_hanh')
            .select(`
        ma_voucher_code, trang_thai, ngay_su_dung, chuoi_ma_bao_mat,
        voucher ( ma_voucher, ten_voucher, gia_ban, ngay_kt, link_voucher_banner, doi_tac ( ten_doanh_nghiep ) ),
        don_hang ( ma_dh, ngay_tao_don )
      `)
            .in('ma_dh', maDhList);
        if (trang_thai) {
            query = query.eq('trang_thai', trang_thai);
        }
        const { data, error } = await query;
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        const sortedData = (data ?? []).sort((a, b) => {
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
    async getVoucherCodeDetail(accessToken, maVoucherCode) {
        const client = this.supabaseService.getClient();
        const maKh = await this.getKhachHang(accessToken);
        const { data: orders } = await client
            .from('don_hang')
            .select('ma_dh')
            .eq('ma_kh', maKh);
        const maDhList = (orders ?? []).map((o) => o.ma_dh);
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
            throw new common_1.NotFoundException('Không tìm thấy voucher code hoặc không có quyền truy cập.');
        }
        return { data };
    }
    async createReview(accessToken, dto) {
        const client = this.supabaseService.getClient();
        const maKh = await this.getKhachHang(accessToken);
        const { data: orders } = await client
            .from('don_hang')
            .select('ma_dh')
            .eq('ma_kh', maKh);
        const maDhList = (orders ?? []).map((o) => o.ma_dh);
        const { data: usedCode } = await client
            .from('voucher_phat_hanh')
            .select('ma_voucher_code')
            .eq('ma_voucher', dto.ma_voucher)
            .eq('trang_thai', 'da_su_dung')
            .in('ma_dh', maDhList)
            .limit(1)
            .single();
        if (!usedCode) {
            throw new common_1.ForbiddenException('Bạn chỉ có thể đánh giá voucher sau khi đã sử dụng.');
        }
        const { data: existing } = await client
            .from('danh_gia')
            .select('ma_dg')
            .eq('ma_kh', maKh)
            .eq('ma_voucher', dto.ma_voucher)
            .single();
        if (existing)
            throw new common_1.ConflictException('Bạn đã đánh giá voucher này rồi.');
        const maDg = `DG-${(0, uuid_1.v4)().slice(0, 8).toUpperCase()}`;
        const { error } = await client.from('danh_gia').insert({
            ma_dg: maDg,
            ma_kh: maKh,
            ma_voucher: dto.ma_voucher,
            diem_so_dg: dto.diem_so_dg,
            noi_dung_binh_luan: dto.noi_dung_binh_luan ?? null,
        });
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return { message: 'Cảm ơn bạn đã đánh giá!', ma_dg: maDg };
    }
    async getOrderHistory(accessToken) {
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
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return { data: data ?? [] };
    }
    async cancelOrder(accessToken, maDh) {
        const client = this.supabaseService.getClient();
        const { data: { user }, error: authError } = await client.auth.getUser(accessToken);
        if (authError || !user)
            throw new common_1.UnauthorizedException('Token không hợp lệ hoặc đã hết hạn.');
        const { data: taiKhoan } = await client
            .from('tai_khoan')
            .select('vai_tro')
            .eq('ma_tk', user.id)
            .single();
        const isAdmin = taiKhoan?.vai_tro === 'admin';
        const { data: order, error: orderError } = await client
            .from('don_hang')
            .select('*')
            .eq('ma_dh', maDh)
            .single();
        if (orderError || !order)
            throw new common_1.NotFoundException('Đơn hàng không tồn tại.');
        if (!isAdmin) {
            const { data: kh } = await client
                .from('khach_hang')
                .select('ma_kh')
                .eq('ma_tk', user.id)
                .single();
            if (!kh || order.ma_kh !== kh.ma_kh) {
                throw new common_1.ForbiddenException('Bạn không có quyền hủy đơn hàng này.');
            }
        }
        if (order.trang_thai_thanh_toan === 'da_huy') {
            throw new common_1.BadRequestException('Đơn hàng đã được hủy trước đó.');
        }
        const { data: voucherCodes, error: vcError } = await client
            .from('voucher_phat_hanh')
            .select('*')
            .eq('ma_dh', maDh);
        if (vcError)
            throw new common_1.InternalServerErrorException(vcError.message);
        const hasUsedCode = (voucherCodes ?? []).some((vc) => vc.trang_thai === 'da_su_dung');
        if (hasUsedCode) {
            throw new common_1.BadRequestException('Không thể hủy đơn hàng do đã có mã voucher được sử dụng.');
        }
        const { error: updateOrderError } = await client
            .from('don_hang')
            .update({ trang_thai_thanh_toan: 'da_huy' })
            .eq('ma_dh', maDh);
        if (updateOrderError)
            throw new common_1.InternalServerErrorException(updateOrderError.message);
        const { error: updateVcError } = await client
            .from('voucher_phat_hanh')
            .update({ trang_thai: 'da_huy' })
            .eq('ma_dh', maDh);
        if (updateVcError)
            throw new common_1.InternalServerErrorException(updateVcError.message);
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
        const maLs = `LS-REFUND-${(0, uuid_1.v4)().slice(0, 8).toUpperCase()}`;
        const { error: refundError } = await client.from('lich_su_giao_dich').insert({
            ma_ls: maLs,
            ma_dh: maDh,
            so_tien: -Number(order.tong_tien),
            phuong_thuc_thanh_toan: order.phuong_thuc_thanh_toan,
            trang_thai_thanh_toan: 'hoan_tien',
        });
        if (refundError)
            throw new common_1.InternalServerErrorException(refundError.message);
        await this.supabaseService.writeLog(user.id, `Hủy đơn hàng và hoàn tiền: ${maDh}`);
        return {
            success: true,
            message: 'Hủy đơn hàng và hoàn tiền thành công.',
            ma_ls: maLs,
        };
    }
    async createComplaint(accessToken, dto) {
        const client = this.supabaseService.getClient();
        const maKh = await this.getKhachHang(accessToken);
        const { data: orders } = await client
            .from('don_hang')
            .select('ma_dh')
            .eq('ma_kh', maKh)
            .eq('trang_thai_thanh_toan', 'thanh_cong');
        const maDhList = (orders ?? []).map((o) => o.ma_dh);
        if (maDhList.length === 0) {
            throw new common_1.ForbiddenException('Bạn chỉ có thể khiếu nại các voucher đã mua thành công.');
        }
        const { data: purchaseRecord } = await client
            .from('voucher_phat_hanh')
            .select('ma_voucher_code')
            .eq('ma_voucher', dto.ma_voucher)
            .in('ma_dh', maDhList)
            .limit(1)
            .single();
        if (!purchaseRecord) {
            throw new common_1.ForbiddenException('Bạn chỉ có thể khiếu nại các voucher đã mua thành công.');
        }
        const maKN = `KN-${(0, uuid_1.v4)().slice(0, 8).toUpperCase()}`;
        const { data, error } = await client
            .from('khieu_nai')
            .insert({
            ma_kn: maKN,
            ma_kh: maKh,
            ma_voucher: dto.ma_voucher,
            ly_do: dto.ly_do,
            trang_thai_xl: 'pending',
        })
            .select()
            .single();
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return {
            success: true,
            data,
            message: 'Gửi khiếu nại thành công.',
        };
    }
    getStripeConfig() {
        return {
            success: true,
            publishableKey: process.env.STRIPE_PUBLIC_KEY,
        };
    }
    async createStripeCheckoutSession(accessToken, emailNhanVoucher) {
        const Stripe = require('stripe');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const client = this.supabaseService.getClient();
        const maKh = await this.getKhachHang(accessToken);
        const { data: cartItems, error: cartError } = await client
            .from('chi_tiet_gio_hang')
            .select(`ma_ctgh, so_luong_mua, ma_voucher, voucher ( ten_voucher, gia_ban, so_luong_phat_hanh, so_luong_da_ban, trang_thai, ngay_kt, link_voucher_banner )`)
            .eq('ma_kh', maKh);
        if (cartError)
            throw new common_1.InternalServerErrorException(cartError.message);
        if (!cartItems || cartItems.length === 0)
            throw new common_1.BadRequestException('Giỏ hàng trống.');
        const now = new Date().toISOString();
        for (const item of cartItems) {
            const v = item.voucher;
            if (v.trang_thai !== 'active')
                throw new common_1.BadRequestException(`Voucher ${item.ma_voucher} không còn hoạt động.`);
            if (v.ngay_kt < now)
                throw new common_1.BadRequestException(`Voucher ${item.ma_voucher} đã hết hạn.`);
            const conLai = v.so_luong_phat_hanh - v.so_luong_da_ban;
            if (item.so_luong_mua > conLai)
                throw new common_1.BadRequestException(`Voucher ${item.ma_voucher} chỉ còn ${conLai} trong kho.`);
        }
        const lineItems = cartItems.map((item) => {
            const v = item.voucher;
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
        const backendUrl = `http://localhost:3001`;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${backendUrl}/api/orders/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${backendUrl}/api/orders/stripe/cancel`,
            metadata: {
                ma_kh: maKh,
                email_nhan_voucher: emailNhanVoucher || '',
            },
        });
        return { url: session.url };
    }
    async handleStripeSuccess(accessToken, sessionId) {
        const Stripe = require('stripe');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
        if (stripeSession.payment_status !== 'paid') {
            throw new common_1.BadRequestException('Giao dịch chưa hoàn tất.');
        }
        const maKh = stripeSession.metadata?.ma_kh;
        if (!maKh)
            throw new common_1.BadRequestException('Không tìm thấy thông tin khách hàng từ phiên Stripe.');
        const client = this.supabaseService.getClient();
        const { data: cartItems, error: cartError } = await client
            .from('chi_tiet_gio_hang')
            .select(`ma_ctgh, so_luong_mua, ma_voucher, voucher ( gia_ban, so_luong_phat_hanh, so_luong_da_ban, trang_thai, ngay_kt )`)
            .eq('ma_kh', maKh);
        if (cartError)
            throw new common_1.InternalServerErrorException(cartError.message);
        if (!cartItems || cartItems.length === 0)
            throw new common_1.BadRequestException('Giỏ hàng trống hoặc đã được xử lý.');
        let tongTien = 0;
        const validItems = [];
        for (const item of cartItems) {
            const v = item.voucher;
            tongTien += v.gia_ban * item.so_luong_mua;
            validItems.push(item);
        }
        const maDh = `DH-${(0, uuid_1.v4)().slice(0, 8).toUpperCase()}`;
        const { error: dhError } = await client.from('don_hang').insert({
            ma_dh: maDh,
            ma_kh: maKh,
            tong_tien: tongTien,
            phuong_thuc_thanh_toan: 'the_quoc_te',
            trang_thai_thanh_toan: 'thanh_cong',
        });
        if (dhError)
            throw new common_1.InternalServerErrorException(dhError.message);
        const chiTietList = [];
        const voucherCodesInsert = [];
        for (const item of validItems) {
            const v = item.voucher;
            const maCtdh = `CTDH-${(0, uuid_1.v4)().slice(0, 8).toUpperCase()}`;
            chiTietList.push({
                ma_ctdh: maCtdh,
                ma_dh: maDh,
                ma_voucher: item.ma_voucher,
                so_luong_mua: item.so_luong_mua,
                don_gia_mua: v.gia_ban,
            });
            for (let i = 0; i < item.so_luong_mua; i++) {
                voucherCodesInsert.push({
                    ma_voucher_code: `VC-${(0, uuid_1.v4)().slice(0, 12).toUpperCase()}`,
                    ma_voucher: item.ma_voucher,
                    ma_dh: maDh,
                    trang_thai: 'chua_su_dung',
                    chuoi_ma_bao_mat: (0, uuid_1.v4)().replace(/-/g, ''),
                });
            }
            await client.rpc('increment_so_luong_da_ban', {
                p_ma_voucher: item.ma_voucher,
                p_so_luong: item.so_luong_mua,
            });
        }
        const { error: ctdhError } = await client.from('chi_tiet_don_hang').insert(chiTietList);
        if (ctdhError)
            throw new common_1.InternalServerErrorException(ctdhError.message);
        const { error: vcError } = await client.from('voucher_phat_hanh').insert(voucherCodesInsert);
        if (vcError)
            throw new common_1.InternalServerErrorException(vcError.message);
        const maLs = `LS-${(0, uuid_1.v4)().slice(0, 8).toUpperCase()}`;
        await client.from('lich_su_giao_dich').insert({
            ma_ls: maLs,
            ma_dh: maDh,
            so_tien: tongTien,
            phuong_thuc_thanh_toan: 'the_quoc_te',
            trang_thai_thanh_toan: 'thanh_cong',
        });
        await client.from('chi_tiet_gio_hang').delete().eq('ma_kh', maKh);
        return { ma_dh: maDh, tong_tien: tongTien };
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map