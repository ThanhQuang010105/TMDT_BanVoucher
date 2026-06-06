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
exports.RedemptionService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../supabase/supabase.service");
let RedemptionService = class RedemptionService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async verifyVoucherCode(ma_voucher_code, ma_cn) {
        const { data: code, error } = await this.supabase
            .getClient()
            .from('voucher_phat_hanh')
            .select('*, voucher(*)')
            .eq('ma_voucher_code', ma_voucher_code)
            .single();
        if (error || !code) {
            throw new common_1.NotFoundException('Mã voucher không tồn tại');
        }
        if (code.trang_thai === 'da_su_dung') {
            throw new common_1.BadRequestException('Mã voucher này đã được sử dụng');
        }
        const now = new Date();
        const ngayKetThuc = new Date(code.voucher.ngay_kt);
        if (now > ngayKetThuc) {
            throw new common_1.BadRequestException('Voucher đã hết hạn sử dụng');
        }
        if (code.voucher.trang_thai !== 'active') {
            throw new common_1.BadRequestException('Voucher không còn hiệu lực');
        }
        const { data: chiNhanh } = await this.supabase
            .getClient()
            .from('voucher_chi_nhanh')
            .select('*')
            .eq('ma_voucher', code.ma_voucher)
            .eq('ma_cn', ma_cn)
            .single();
        if (!chiNhanh) {
            throw new common_1.BadRequestException('Chi nhánh này không được áp dụng voucher');
        }
        return {
            success: true,
            data: code,
            message: 'Mã voucher hợp lệ',
        };
    }
    async redeemVoucherCode(ma_voucher_code, ma_cn, userId) {
        await this.verifyVoucherCode(ma_voucher_code, ma_cn);
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
            throw new common_1.BadRequestException('Không thể cập nhật trạng thái mã voucher');
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
    async getPurchaseHistory(ma_kh) {
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
        if (error)
            throw new common_1.BadRequestException(error.message);
        return {
            success: true,
            data,
            message: 'Lấy lịch sử mua hàng thành công',
        };
    }
    async getPartnerStats(ma_dt) {
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
        if (error)
            throw new common_1.BadRequestException(error.message);
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
    async getAdminStats() {
        const { data: vouchers, error } = await this.supabase
            .getClient()
            .from('voucher')
            .select('gia_ban, so_luong_da_ban, trang_thai');
        if (error)
            throw new common_1.BadRequestException(error.message);
        const { data: orders, error: orderError } = await this.supabase
            .getClient()
            .from('don_hang')
            .select('tong_tien, trang_thai_thanh_toan');
        if (orderError)
            throw new common_1.BadRequestException(orderError.message);
        const tongDoanhThu = orders
            .filter((o) => o.trang_thai_thanh_toan === 'thanh_cong')
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
};
exports.RedemptionService = RedemptionService;
exports.RedemptionService = RedemptionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], RedemptionService);
//# sourceMappingURL=redemption.service.js.map