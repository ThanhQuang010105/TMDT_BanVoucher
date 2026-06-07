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
const voucher_status_enum_1 = require("./enums/voucher-status.enum");
const uuid_1 = require("uuid");
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
         danh_muc ( ma_taxon, ten_taxon )`, { count: 'exact' });
        if (dto.hieu_luc) {
            if (dto.hieu_luc === 'dang_dien_ra') {
                query = query
                    .eq('trang_thai', 'active')
                    .gte('ngay_kt', now)
                    .lte('ngay_bd', now);
            }
            else if (dto.hieu_luc === 'sap_dien_ra') {
                query = query
                    .in('trang_thai', ['active', 'scheduled'])
                    .gt('ngay_bd', now);
            }
            else if (dto.hieu_luc === 'het_han') {
                query = query.lt('ngay_kt', now);
            }
        }
        else {
            query = query
                .eq('trang_thai', 'active')
                .gte('ngay_kt', now)
                .lte('ngay_bd', now);
        }
        query = query.gt('so_luong_phat_hanh', 0);
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
    async getPhanLoai() {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
            .from('phan_loai')
            .select('ma_pl, ten_loai_voucher, trang_thai, mo_ta')
            .eq('trang_thai', 'active')
            .order('ten_loai_voucher');
        if (error) {
            const { data: all } = await client
                .from('phan_loai')
                .select('ma_pl, ten_loai_voucher, mo_ta');
            return { data: all ?? [] };
        }
        return { data: data ?? [] };
    }
    async createVoucher(dto, userId) {
        if (dto.GiaBan > dto.GiaGoc) {
            throw new common_1.BadRequestException('Giá bán phải nhỏ hơn hoặc bằng giá gốc');
        }
        if (new Date(dto.NgayBD) >= new Date(dto.NgayKT)) {
            throw new common_1.BadRequestException('Ngày bắt đầu phải trước ngày kết thúc');
        }
        if (new Date(dto.NgayKT) <= new Date()) {
            throw new common_1.BadRequestException('Ngày kết thúc phải lớn hơn thời điểm hiện tại');
        }
        const client = this.supabaseService.getClient();
        let partnerId = dto.MaDT;
        if (userId) {
            const { data: doiTac } = await client
                .from('doi_tac')
                .select('ma_dt')
                .eq('ma_tk', userId)
                .single();
            if (doiTac) {
                partnerId = doiTac.ma_dt;
            }
        }
        if (!partnerId) {
            throw new common_1.BadRequestException('Không xác định được đối tác tạo voucher. Vui lòng kiểm tra lại tài khoản.');
        }
        const maVoucher = `VC-${(0, uuid_1.v4)().slice(0, 8).toUpperCase()}`;
        const voucherData = {
            ma_voucher: maVoucher,
            ma_dt: partnerId,
            ma_pl: dto.MaPL,
            ma_taxon: dto.MaTaxon,
            ten_voucher: dto.TenVoucher,
            mo_ta: dto.MoTa,
            gia_goc: dto.GiaGoc,
            gia_ban: dto.GiaBan,
            so_luong_phat_hanh: dto.SoLuongPhatHanh,
            so_luong_da_ban: 0,
            ngay_bd: dto.NgayBD,
            ngay_kt: dto.NgayKT,
            link_voucher_banner: dto.bannerUrl,
            trang_thai: voucher_status_enum_1.VoucherStatus.DRAFT,
        };
        const { data, error } = await this.supabaseService
            .getClient()
            .from('voucher')
            .insert(voucherData)
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        if (userId) {
            await this.supabaseService.writeLog(userId, `Tạo mới voucher nháp: ${dto.TenVoucher} (${maVoucher})`);
        }
        return {
            success: true,
            data,
            message: 'Tạo voucher nháp thành công',
        };
    }
    async getAllVouchers(userId) {
        const client = this.supabaseService.getClient();
        let query = client.from('voucher').select('*');
        if (userId) {
            const { data: taiKhoan } = await client
                .from('tai_khoan')
                .select('vai_tro')
                .eq('ma_tk', userId)
                .single();
            if (taiKhoan?.vai_tro === 'doi_tac') {
                const { data: doiTac } = await client
                    .from('doi_tac')
                    .select('ma_dt')
                    .eq('ma_tk', userId)
                    .single();
                if (doiTac) {
                    query = query.eq('ma_dt', doiTac.ma_dt);
                }
                else {
                    return {
                        success: true,
                        data: [],
                    };
                }
            }
        }
        const { data, error } = await query;
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        return {
            success: true,
            data: data ?? [],
        };
    }
    async getPartnerProfile(userId) {
        const client = this.supabaseService.getClient();
        const { data: partner, error } = await client
            .from('doi_tac')
            .select('*, tai_khoan(trang_thai_hoat_dong)')
            .eq('ma_tk', userId)
            .single();
        if (error || !partner) {
            throw new common_1.NotFoundException('Không tìm thấy thông tin đối tác');
        }
        return {
            success: true,
            data: {
                ma_dt: partner.ma_dt,
                ten_doanh_nghiep: partner.ten_doanh_nghiep,
                nguoi_dai_dien: partner.nguoi_dai_dien,
                ma_so_thue: partner.ma_so_thue,
                trang_thai_duyet: partner.trang_thai_duyet,
                trang_thai_hoat_dong: partner.tai_khoan?.trang_thai_hoat_dong,
            },
        };
    }
    extractPathFromUrl(url) {
        try {
            const parts = url.split('/storage/v1/object/public/images/');
            return parts[1] || null;
        }
        catch {
            return null;
        }
    }
    async updateVoucher(id, payload, userId) {
        const client = this.supabaseService.getClient();
        const { data: voucher, error: findError } = await client
            .from('voucher')
            .select('*')
            .eq('ma_voucher', id)
            .single();
        if (findError || !voucher) {
            throw new common_1.NotFoundException('Voucher không tồn tại');
        }
        if (payload.link_voucher_banner && payload.link_voucher_banner !== voucher.link_voucher_banner) {
            const oldPath = this.extractPathFromUrl(voucher.link_voucher_banner);
            if (oldPath) {
                await client.storage.from('images').remove([oldPath]);
            }
        }
        if (voucher.trang_thai === voucher_status_enum_1.VoucherStatus.REJECTED ||
            voucher.trang_thai === voucher_status_enum_1.VoucherStatus.SCHEDULED) {
            payload.trang_thai = voucher_status_enum_1.VoucherStatus.PENDING;
        }
        if (voucher.trang_thai === voucher_status_enum_1.VoucherStatus.DRAFT) {
            payload.trang_thai = voucher_status_enum_1.VoucherStatus.DRAFT;
        }
        const { data, error } = await client
            .from('voucher')
            .update(payload)
            .eq('ma_voucher', id)
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        if (userId) {
            await this.supabaseService.writeLog(userId, `Cập nhật thông tin voucher: ${id}`);
        }
        return {
            success: true,
            data,
            message: 'Cập nhật thông tin voucher thành công',
        };
    }
    async removeVoucher(id, userId) {
        const client = this.supabaseService.getClient();
        const { data: voucher } = await client
            .from('voucher')
            .select('*')
            .eq('ma_voucher', id)
            .single();
        if (voucher?.link_voucher_banner) {
            const oldPath = this.extractPathFromUrl(voucher.link_voucher_banner);
            if (oldPath) {
                await client.storage.from('images').remove([oldPath]);
            }
        }
        const { error } = await client
            .from('voucher')
            .delete()
            .eq('ma_voucher', id);
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        if (userId) {
            await this.supabaseService.writeLog(userId, `Xóa voucher: ${id}`);
        }
        return {
            success: true,
            message: 'Xóa voucher thành công',
        };
    }
    async submitVoucher(id, userId) {
        const { data: voucher, error: findError } = await this.supabaseService
            .getClient()
            .from('voucher')
            .select('*')
            .eq('ma_voucher', id)
            .single();
        if (findError || !voucher) {
            throw new common_1.NotFoundException('Voucher không tồn tại');
        }
        if (voucher.trang_thai !== voucher_status_enum_1.VoucherStatus.DRAFT) {
            throw new common_1.BadRequestException('Voucher không còn ở trạng thái nháp để gửi duyệt');
        }
        const { data, error } = await this.supabaseService
            .getClient()
            .from('voucher')
            .update({
            trang_thai: voucher_status_enum_1.VoucherStatus.PENDING,
        })
            .eq('ma_voucher', id)
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        if (userId) {
            await this.supabaseService.writeLog(userId, `Gửi duyệt voucher: ${id}`);
        }
        return {
            success: true,
            data,
            message: 'Gửi duyệt voucher thành công',
        };
    }
    async searchVoucherForAdmin(query, userId) {
        const client = this.supabaseService.getClient();
        let request = client.from('voucher').select('*');
        if (userId) {
            const { data: taiKhoan } = await client
                .from('tai_khoan')
                .select('vai_tro')
                .eq('ma_tk', userId)
                .single();
            if (taiKhoan?.vai_tro === 'doi_tac') {
                const { data: doiTac } = await client
                    .from('doi_tac')
                    .select('ma_dt')
                    .eq('ma_tk', userId)
                    .single();
                if (doiTac) {
                    request = request.eq('ma_dt', doiTac.ma_dt);
                }
                else {
                    return {
                        success: true,
                        total: 0,
                        data: [],
                    };
                }
            }
        }
        if (query.TenVoucher) {
            request = request.ilike('ten_voucher', `%${query.TenVoucher}%`);
        }
        if (query.TrangThai) {
            request = request.eq('trang_thai', query.TrangThai.toLowerCase());
        }
        if (query.GiaMin) {
            request = request.gte('gia_ban', query.GiaMin);
        }
        if (query.GiaMax) {
            request = request.lte('gia_ban', query.GiaMax);
        }
        const { data, error } = await request;
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        let results = data ?? [];
        if (query.TiLeGiamMin) {
            results = results.filter((v) => ((v.gia_goc - v.gia_ban) / v.gia_goc) * 100 >= query.TiLeGiamMin);
        }
        return {
            success: true,
            total: results.length,
            data: results,
        };
    }
    async approveVoucher(id, userId) {
        const { data: voucher, error: findError } = await this.supabaseService
            .getClient()
            .from('voucher')
            .select('*')
            .eq('ma_voucher', id)
            .single();
        if (findError || !voucher) {
            throw new common_1.NotFoundException('Voucher không tồn tại');
        }
        if (voucher.trang_thai !== voucher_status_enum_1.VoucherStatus.PENDING) {
            throw new common_1.BadRequestException('Voucher không ở trạng thái chờ duyệt');
        }
        if (Number(voucher.gia_ban) > Number(voucher.gia_goc)) {
            throw new common_1.BadRequestException('Giá bán không được lớn hơn giá gốc');
        }
        const ngayBd = new Date(voucher.ngay_bd);
        const ngayKt = new Date(voucher.ngay_kt);
        if (ngayBd >= ngayKt) {
            throw new common_1.BadRequestException('Ngày bắt đầu phải trước ngày kết thúc');
        }
        if (ngayKt <= new Date()) {
            throw new common_1.BadRequestException('Ngày kết thúc phải lớn hơn thời điểm hiện tại');
        }
        const now = new Date();
        const status = new Date(voucher.ngay_bd) > now
            ? voucher_status_enum_1.VoucherStatus.SCHEDULED
            : voucher_status_enum_1.VoucherStatus.ACTIVE;
        const { data, error } = await this.supabaseService
            .getClient()
            .from('voucher')
            .update({
            trang_thai: status,
        })
            .eq('ma_voucher', id)
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        if (userId) {
            await this.supabaseService.writeLog(userId, `Phê duyệt voucher: ${id}`);
        }
        return {
            success: true,
            data,
            message: 'Duyệt voucher thành công',
        };
    }
    async rejectVoucher(id, userId) {
        const { data: voucher, error: findError } = await this.supabaseService
            .getClient()
            .from('voucher')
            .select('*')
            .eq('ma_voucher', id)
            .single();
        if (findError || !voucher) {
            throw new common_1.NotFoundException('Voucher không tồn tại');
        }
        if (voucher.trang_thai !== voucher_status_enum_1.VoucherStatus.PENDING) {
            throw new common_1.BadRequestException('Voucher không ở trạng thái chờ duyệt');
        }
        const { data, error } = await this.supabaseService
            .getClient()
            .from('voucher')
            .update({
            trang_thai: voucher_status_enum_1.VoucherStatus.REJECTED,
        })
            .eq('ma_voucher', id)
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        if (userId) {
            await this.supabaseService.writeLog(userId, `Từ chối duyệt voucher: ${id}`);
        }
        return {
            success: true,
            data,
            message: 'Từ chối duyệt voucher thành công',
        };
    }
    async getBranches(maDT) {
        const { data, error } = await this.supabaseService
            .getClient()
            .from('chi_nhanh')
            .select('*')
            .eq('ma_dt', maDT);
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        return {
            success: true,
            data,
        };
    }
    async uploadBanner(file) {
        const fileName = `banner-url/${Date.now()}-${file.originalname}`;
        const { error } = await this.supabaseService
            .getClient()
            .storage.from('images')
            .upload(fileName, file.buffer, {
            contentType: file.mimetype,
        });
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        const { data: { publicUrl }, } = this.supabaseService
            .getClient()
            .storage.from('images')
            .getPublicUrl(fileName);
        return {
            success: true,
            data: {
                bannerUrl: publicUrl,
            },
            message: 'Upload banner thành công',
        };
    }
    async createBranch(dto) {
        const client = this.supabaseService.getClient();
        const { data: doiTac, error: dtError } = await client
            .from('doi_tac')
            .select('ma_dt')
            .eq('ma_dt', dto.ma_dt)
            .single();
        if (dtError || !doiTac) {
            throw new common_1.NotFoundException('Đối tác không tồn tại');
        }
        const maCN = `CN-${(0, uuid_1.v4)().slice(0, 8).toUpperCase()}`;
        const { data, error } = await client
            .from('chi_nhanh')
            .insert({
            ma_cn: maCN,
            ma_dt: dto.ma_dt,
            ten_chi_nhanh: dto.ten_chi_nhanh,
            dia_chi: dto.dia_chi ?? null,
            trang_thai_hoat_dong: dto.trang_thai_hoat_dong ?? 'active',
        })
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        return {
            success: true,
            data,
            message: 'Thêm chi nhánh thành công',
        };
    }
    async updateBranch(maCN, dto) {
        const client = this.supabaseService.getClient();
        const { data: chiNhanh, error: cnError } = await client
            .from('chi_nhanh')
            .select('*')
            .eq('ma_cn', maCN)
            .single();
        if (cnError || !chiNhanh) {
            throw new common_1.NotFoundException('Chi nhánh không tồn tại');
        }
        const { data, error } = await client
            .from('chi_nhanh')
            .update({
            ten_chi_nhanh: dto.ten_chi_nhanh ?? chiNhanh.ten_chi_nhanh,
            dia_chi: dto.dia_chi ?? chiNhanh.dia_chi,
            trang_thai_hoat_dong: dto.trang_thai_hoat_dong ?? chiNhanh.trang_thai_hoat_dong,
        })
            .eq('ma_cn', maCN)
            .select()
            .single();
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        return {
            success: true,
            data,
            message: 'Cập nhật thông tin chi nhánh thành công',
        };
    }
    async deleteBranch(maCN) {
        const client = this.supabaseService.getClient();
        const { data: chiNhanh, error: cnError } = await client
            .from('chi_nhanh')
            .select('ma_cn')
            .eq('ma_cn', maCN)
            .single();
        if (cnError || !chiNhanh) {
            throw new common_1.NotFoundException('Chi nhánh không tồn tại');
        }
        const { error } = await client
            .from('chi_nhanh')
            .delete()
            .eq('ma_cn', maCN);
        if (error) {
            throw new common_1.BadRequestException(error.message);
        }
        return {
            success: true,
            message: 'Xóa chi nhánh thành công',
        };
    }
};
exports.VouchersService = VouchersService;
exports.VouchersService = VouchersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], VouchersService);
//# sourceMappingURL=vouchers.service.js.map