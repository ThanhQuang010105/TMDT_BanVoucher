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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../supabase/supabase.service");
const uuid_1 = require("uuid");
let AuthService = class AuthService {
    supabaseService;
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async register(dto) {
        const adminClient = this.supabaseService.getClient();
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email: dto.email,
            password: dto.password,
            email_confirm: true,
        });
        if (authError) {
            if (authError.message.toLowerCase().includes('already registered') ||
                authError.message.toLowerCase().includes('already been registered') ||
                authError.code === 'email_exists') {
                throw new common_1.ConflictException('Email này đã được sử dụng. Vui lòng đăng nhập.');
            }
            throw new common_1.BadRequestException(authError.message);
        }
        const userId = authData.user?.id;
        if (!userId)
            throw new common_1.InternalServerErrorException('Không thể tạo tài khoản Auth.');
        const { error: tkError } = await adminClient.from('tai_khoan').insert({
            ma_tk: userId,
            username: dto.email,
            vai_tro: 'khach_hang',
            trang_thai_hoat_dong: 'active',
        });
        if (tkError)
            throw new common_1.InternalServerErrorException(`Lỗi tạo tai_khoan: ${tkError.message}`);
        const maKh = `KH-${(0, uuid_1.v4)().slice(0, 8).toUpperCase()}`;
        const { error: khError } = await adminClient.from('khach_hang').insert({
            ma_kh: maKh,
            ma_tk: userId,
            ho_ten: dto.ho_ten,
            sdt: dto.sdt ?? null,
            dia_chi: dto.dia_chi ?? null,
            email: dto.email,
        });
        if (khError)
            throw new common_1.InternalServerErrorException(`Lỗi tạo khach_hang: ${khError.message}`);
        return {
            message: 'Đăng ký thành công! Tài khoản đã được kích hoạt, bạn có thể đăng nhập ngay.',
            ma_kh: maKh,
        };
    }
    async login(dto) {
        const authClient = this.supabaseService.getAuthClient();
        const adminClient = this.supabaseService.getClient();
        const { data, error } = await authClient.auth.signInWithPassword({
            email: dto.email,
            password: dto.password,
        });
        if (error) {
            throw new common_1.UnauthorizedException('Email hoặc mật khẩu không đúng.');
        }
        const { data: taiKhoan } = await adminClient
            .from('tai_khoan')
            .select('vai_tro, trang_thai_hoat_dong')
            .eq('ma_tk', data.user.id)
            .single();
        if (taiKhoan?.trang_thai_hoat_dong !== 'active') {
            throw new common_1.UnauthorizedException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.');
        }
        return {
            message: 'Đăng nhập thành công.',
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            user: {
                id: data.user.id,
                email: data.user.email,
                vai_tro: taiKhoan?.vai_tro,
            },
        };
    }
    async logout(accessToken) {
        const authClient = this.supabaseService.getAuthClient();
        await authClient.auth.setSession({ access_token: accessToken, refresh_token: '' });
        const { error } = await authClient.auth.signOut();
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        return { message: 'Đăng xuất thành công.' };
    }
    async forgotPassword(dto) {
        const authClient = this.supabaseService.getAuthClient();
        const { error } = await authClient.auth.resetPasswordForEmail(dto.email, {
            redirectTo: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/reset-password`,
        });
        if (error)
            throw new common_1.BadRequestException(error.message);
        return {
            message: 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi link đặt lại mật khẩu.',
        };
    }
    async resetPassword(dto) {
        const authClient = this.supabaseService.getAuthClient();
        await authClient.auth.setSession({
            access_token: dto.access_token,
            refresh_token: '',
        });
        const { error } = await authClient.auth.updateUser({
            password: dto.new_password,
        });
        if (error)
            throw new common_1.BadRequestException(`Đặt lại mật khẩu thất bại: ${error.message}`);
        return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AuthService);
//# sourceMappingURL=auth.service.js.map