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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../supabase/supabase.service");
let AdminService = class AdminService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    async getAllUsers() {
        const { data, error } = await this.supabase
            .getClient()
            .auth.admin.listUsers();
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { success: true, data: data.users, message: 'Lấy danh sách user thành công' };
    }
    async banUser(userId) {
        const { data, error } = await this.supabase
            .getClient()
            .auth.admin.updateUserById(userId, { ban_duration: '876600h' });
        if (error)
            throw new common_1.NotFoundException(error.message);
        await this.supabase
            .getClient()
            .from('tai_khoan')
            .update({ trang_thai_hoat_dong: 'banned' })
            .eq('ma_tk', userId);
        return { success: true, data, message: 'Khóa tài khoản thành công' };
    }
    async unbanUser(userId) {
        const { data, error } = await this.supabase
            .getClient()
            .auth.admin.updateUserById(userId, { ban_duration: 'none' });
        if (error)
            throw new common_1.NotFoundException(error.message);
        await this.supabase
            .getClient()
            .from('tai_khoan')
            .update({ trang_thai_hoat_dong: 'active' })
            .eq('ma_tk', userId);
        return { success: true, data, message: 'Mở khóa tài khoản thành công' };
    }
    async getPendingVouchers() {
        const { data, error } = await this.supabase
            .getClient()
            .from('voucher')
            .select('*, doi_tac(ten_doanh_nghiep)')
            .eq('trang_thai', 'pending');
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { success: true, data, message: 'Lấy danh sách voucher chờ duyệt thành công' };
    }
    async approveVoucher(voucherId) {
        const { data, error } = await this.supabase
            .getClient()
            .from('voucher')
            .update({ trang_thai: 'active' })
            .eq('ma_voucher', voucherId)
            .eq('trang_thai', 'pending')
            .select()
            .single();
        if (error || !data)
            throw new common_1.NotFoundException('Voucher không tồn tại hoặc không ở trạng thái pending');
        return { success: true, data, message: 'Duyệt voucher thành công' };
    }
    async rejectVoucher(voucherId) {
        const { data, error } = await this.supabase
            .getClient()
            .from('voucher')
            .update({ trang_thai: 'rejected' })
            .eq('ma_voucher', voucherId)
            .eq('trang_thai', 'pending')
            .select()
            .single();
        if (error || !data)
            throw new common_1.NotFoundException('Voucher không tồn tại hoặc không ở trạng thái pending');
        return { success: true, data, message: 'Từ chối voucher thành công' };
    }
    async getPendingPartners() {
        const { data, error } = await this.supabase
            .getClient()
            .from('doi_tac')
            .select('*')
            .eq('trang_thai_duyet', 'pending');
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { success: true, data, message: 'Lấy danh sách đối tác chờ duyệt thành công' };
    }
    async approvePartner(maDT) {
        const client = this.supabase.getClient();
        const { data: partner, error: findError } = await client
            .from('doi_tac')
            .select('*')
            .eq('ma_dt', maDT)
            .single();
        if (findError || !partner)
            throw new common_1.NotFoundException('Không tìm thấy đối tác');
        const { error: dtError } = await client
            .from('doi_tac')
            .update({ trang_thai_duyet: 'approved' })
            .eq('ma_dt', maDT);
        if (dtError)
            throw new common_1.BadRequestException(dtError.message);
        await client
            .from('tai_khoan')
            .update({ trang_thai_hoat_dong: 'active' })
            .eq('ma_tk', partner.ma_tk);
        await this.supabase.writeLog(partner.ma_tk, `Phê duyệt hồ sơ đối tác: ${partner.ten_doanh_nghiep}`);
        return { success: true, message: 'Phê duyệt đối tác thành công' };
    }
    async rejectPartner(maDT) {
        const client = this.supabase.getClient();
        const { data: partner, error: findError } = await client
            .from('doi_tac')
            .select('*')
            .eq('ma_dt', maDT)
            .single();
        if (findError || !partner)
            throw new common_1.NotFoundException('Không tìm thấy đối tác');
        const { error: dtError } = await client
            .from('doi_tac')
            .update({ trang_thai_duyet: 'rejected' })
            .eq('ma_dt', maDT);
        if (dtError)
            throw new common_1.BadRequestException(dtError.message);
        await this.supabase.writeLog(partner.ma_tk, `Từ chối duyệt hồ sơ đối tác: ${partner.ten_doanh_nghiep}`);
        return { success: true, message: 'Từ chối duyệt đối tác thành công' };
    }
    async lockPartner(maDT) {
        const client = this.supabase.getClient();
        const { data: partner, error: findError } = await client
            .from('doi_tac')
            .select('ma_tk, ten_doanh_nghiep')
            .eq('ma_dt', maDT)
            .single();
        if (findError || !partner)
            throw new common_1.NotFoundException('Không tìm thấy đối tác');
        await this.banUser(partner.ma_tk);
        await this.supabase.writeLog(partner.ma_tk, `Khóa tài khoản đối tác: ${partner.ten_doanh_nghiep}`);
        return { success: true, message: 'Khóa đối tác thành công' };
    }
    async unlockPartner(maDT) {
        const client = this.supabase.getClient();
        const { data: partner, error: findError } = await client
            .from('doi_tac')
            .select('ma_tk, ten_doanh_nghiep')
            .eq('ma_dt', maDT)
            .single();
        if (findError || !partner)
            throw new common_1.NotFoundException('Không tìm thấy đối tác');
        await this.unbanUser(partner.ma_tk);
        await this.supabase.writeLog(partner.ma_tk, `Mở khóa tài khoản đối tác: ${partner.ten_doanh_nghiep}`);
        return { success: true, message: 'Mở khóa đối tác thành công' };
    }
    async getAllComplaints() {
        const { data, error } = await this.supabase
            .getClient()
            .from('khieu_nai')
            .select('*, khach_hang(ho_ten), voucher(ten_voucher)')
            .order('ma_kn', { ascending: false });
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { success: true, data };
    }
    async resolveComplaint(maKN, ketQuaXL) {
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
        if (error || !data)
            throw new common_1.NotFoundException('Không tìm thấy khiếu nại');
        return { success: true, data, message: 'Xử lý khiếu nại thành công' };
    }
    async getSystemLogs() {
        const { data, error } = await this.supabase
            .getClient()
            .from('nhat_ky_he_thong')
            .select('*, tai_khoan(username, vai_tro)')
            .order('thoi_gian', { ascending: false });
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { success: true, data };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AdminService);
//# sourceMappingURL=admin.service.js.map