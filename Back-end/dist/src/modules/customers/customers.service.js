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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../supabase/supabase.service");
let CustomersService = class CustomersService {
    supabaseService;
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async getMyProfile(accessToken) {
        const client = this.supabaseService.getClient();
        const { data: { user }, error: authError } = await client.auth.getUser(accessToken);
        if (authError || !user)
            throw new common_1.UnauthorizedException('Token không hợp lệ hoặc đã hết hạn.');
        const { data, error } = await client
            .from('khach_hang')
            .select('ma_kh, ho_ten, sdt, dia_chi, email')
            .eq('ma_tk', user.id)
            .single();
        if (error || !data)
            throw new common_1.NotFoundException('Không tìm thấy hồ sơ khách hàng.');
        return { data };
    }
    async updateMyProfile(accessToken, dto) {
        const client = this.supabaseService.getClient();
        const { data: { user }, error: authError } = await client.auth.getUser(accessToken);
        if (authError || !user)
            throw new common_1.UnauthorizedException('Token không hợp lệ hoặc đã hết hạn.');
        const updatePayload = {};
        if (dto.ho_ten !== undefined)
            updatePayload.ho_ten = dto.ho_ten;
        if (dto.sdt !== undefined)
            updatePayload.sdt = dto.sdt;
        if (dto.dia_chi !== undefined)
            updatePayload.dia_chi = dto.dia_chi;
        if (Object.keys(updatePayload).length === 0) {
            throw new common_1.BadRequestException('Không có dữ liệu nào được cập nhật.');
        }
        const { data, error } = await client
            .from('khach_hang')
            .update(updatePayload)
            .eq('ma_tk', user.id)
            .select()
            .single();
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return { message: 'Cập nhật hồ sơ thành công.', data };
    }
    async changePassword(accessToken, dto) {
        const client = this.supabaseService.getClient();
        const { data: { user }, error: authError } = await client.auth.getUser(accessToken);
        if (authError || !user)
            throw new common_1.UnauthorizedException('Token không hợp lệ hoặc đã hết hạn.');
        const { error: verifyError } = await client.auth.signInWithPassword({
            email: user.email,
            password: dto.old_password,
        });
        if (verifyError)
            throw new common_1.BadRequestException('Mật khẩu cũ không đúng.');
        await client.auth.setSession({ access_token: accessToken, refresh_token: '' });
        const { error: updateError } = await client.auth.updateUser({
            password: dto.new_password,
        });
        if (updateError)
            throw new common_1.BadRequestException(updateError.message);
        return { message: 'Đổi mật khẩu thành công.' };
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map