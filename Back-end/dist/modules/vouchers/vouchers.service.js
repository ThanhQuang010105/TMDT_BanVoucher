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
exports.VouchersService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../supabase/supabase.service");
let VouchersService = class VouchersService {
    supabaseService;
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async getHomepageData() {
        const client = this.supabaseService.getClient();
        const { data: categories } = await client
            .from('danh_muc')
            .select('ma_taxon, ten_taxon, ma_taxonomy')
            .is('ma_taxon_cha', null)
            .order('thu_tu_hien_thi');
        const now = new Date().toISOString();
        const { data: featuredVouchers } = await client
            .from('voucher')
            .select(`
        ma_voucher, ten_voucher, mo_ta, gia_goc, gia_ban,
        so_luong_phat_hanh, so_luong_da_ban, ngay_bd, ngay_kt, link_voucher_banner,
        doi_tac ( ten_doanh_nghiep )
      `)
            .eq('trang_thai', 'active')
            .gte('ngay_kt', now)
            .lte('ngay_bd', now)
            .order('ngay_bd', { ascending: false })
            .limit(12);
        return {
            categories: categories ?? [],
            featured_vouchers: featuredVouchers ?? [],
        };
    }
    async searchVouchers(dto) {
        const client = this.supabaseService.getClient();
        const page = parseInt(dto.page ?? '1', 10);
        const limit = parseInt(dto.limit ?? '12', 10);
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        const now = new Date().toISOString();
        let query = client
            .from('voucher')
            .select(`ma_voucher, ten_voucher, mo_ta, gia_goc, gia_ban,
         so_luong_phat_hanh, so_luong_da_ban, ngay_bd, ngay_kt, link_voucher_banner,
         doi_tac ( ma_dt, ten_doanh_nghiep ),
         danh_muc ( ma_taxon, ten_taxon )`, { count: 'exact' })
            .eq('trang_thai', 'active')
            .gte('ngay_kt', now)
            .lte('ngay_bd', now)
            .gt('so_luong_phat_hanh', 0);
        if (dto.keyword) {
            query = query.ilike('ten_voucher', `%${dto.keyword}%`);
        }
        if (dto.ma_taxon) {
            query = query.eq('ma_taxon', dto.ma_taxon);
        }
        if (dto.ma_dt) {
            query = query.eq('ma_dt', dto.ma_dt);
        }
        if (dto.gia_min) {
            query = query.gte('gia_ban', parseFloat(dto.gia_min));
        }
        if (dto.gia_max) {
            query = query.lte('gia_ban', parseFloat(dto.gia_max));
        }
        const { data, count, error } = await query.range(from, to);
        if (error)
            throw new common_1.NotFoundException(error.message);
        return {
            data: data ?? [],
            pagination: {
                total: count ?? 0,
                page,
                limit,
                total_pages: Math.ceil((count ?? 0) / limit),
            },
        };
    }
    async getVoucherDetail(maVoucher) {
        const client = this.supabaseService.getClient();
        const { data: voucher, error } = await client
            .from('voucher')
            .select(`
        ma_voucher, ten_voucher, mo_ta, gia_goc, gia_ban,
        so_luong_phat_hanh, so_luong_da_ban, ngay_bd, ngay_kt, trang_thai, link_voucher_banner,
        doi_tac ( ma_dt, ten_doanh_nghiep, nguoi_dai_dien ),
        danh_muc ( ma_taxon, ten_taxon ),
        phan_loai ( ma_pl, ten_loai_voucher )
      `)
            .eq('ma_voucher', maVoucher)
            .single();
        if (error || !voucher)
            throw new common_1.NotFoundException('Không tìm thấy voucher.');
        const { data: chiNhanh } = await client
            .from('chi_nhanh')
            .select('ma_cn, ten_chi_nhanh, dia_chi')
            .eq('ma_dt', voucher.doi_tac?.ma_dt ?? '')
            .eq('trang_thai_hoat_dong', 'active');
        const { data: reviews } = await client
            .from('danh_gia')
            .select(`
        ma_dg, diem_so_dg, noi_dung_binh_luan, ngay_danh_gia,
        khach_hang ( ho_ten )
      `)
            .eq('ma_voucher', maVoucher)
            .order('ngay_danh_gia', { ascending: false })
            .limit(10);
        const avgRating = reviews && reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + (r.diem_so_dg ?? 0), 0) / reviews.length).toFixed(1)
            : null;
        const conLai = voucher.so_luong_phat_hanh - voucher.so_luong_da_ban;
        return {
            data: {
                ...voucher,
                ton_kho: conLai,
                chi_nhanh: chiNhanh ?? [],
                danh_gia: reviews ?? [],
                diem_trung_binh: avgRating,
                so_luong_danh_gia: reviews?.length ?? 0,
            },
        };
    }
    async getCategories() {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
            .from('danh_muc')
            .select('ma_taxon, ten_taxon, ma_taxon_cha, ma_taxonomy, thu_tu_hien_thi')
            .order('thu_tu_hien_thi');
        if (error)
            throw new common_1.NotFoundException(error.message);
        return { data: data ?? [] };
    }
};
exports.VouchersService = VouchersService;
exports.VouchersService = VouchersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], VouchersService);
//# sourceMappingURL=vouchers.service.js.map