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
        await this.supabaseService.writeLog(userId, 'Đăng ký tài khoản khách hàng mới');
        return {
            message: 'Đăng ký thành công! Tài khoản đã được kích hoạt, bạn có thể đăng nhập ngay.',
            ma_kh: maKh,
        };
    }
    async registerAdmin(dto) {
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
            vai_tro: 'admin',
            trang_thai_hoat_dong: 'active',
        });
        if (tkError)
            throw new common_1.InternalServerErrorException(`Lỗi tạo tai_khoan: ${tkError.message}`);
        await this.supabaseService.writeLog(userId, 'Đăng ký tài khoản Admin mới');
        return {
            success: true,
            message: 'Đăng ký tài khoản Admin thành công!',
        };
    }
    async registerPartner(dto) {
        const adminClient = this.supabaseService.getClient();
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email: dto.email,
            password: dto.password,
            email_confirm: true,
            user_metadata: { role: 'doi_tac' },
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
            vai_tro: 'doi_tac',
            trang_thai_hoat_dong: 'pending',
        });
        if (tkError)
            throw new common_1.InternalServerErrorException(`Lỗi tạo tai_khoan: ${tkError.message}`);
        const maDt = `DT-${(0, uuid_1.v4)().slice(0, 8).toUpperCase()}`;
        const { error: dtError } = await adminClient.from('doi_tac').insert({
            ma_dt: maDt,
            ma_tk: userId,
            ten_doanh_nghiep: dto.ten_doanh_nghiep,
            nguoi_dai_dien: dto.nguoi_dai_dien ?? null,
            ma_so_thue: dto.ma_so_thue ?? null,
            trang_thai_duyet: 'pending',
        });
        if (dtError)
            throw new common_1.InternalServerErrorException(`Lỗi tạo doi_tac: ${dtError.message}`);
        await this.supabaseService.writeLog(userId, `Đăng ký hồ sơ đối tác mới: ${dto.ten_doanh_nghiep}`);
        return {
            success: true,
            message: 'Đăng ký tài khoản đối tác thành công! Vui lòng chờ Admin phê duyệt hồ sơ.',
            ma_dt: maDt,
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
            throw new common_1.UnauthorizedException('Tài khoản của bạn đã bị khóa hoặc đang chờ phê duyệt. Vui lòng liên hệ hỗ trợ.');
        }
        await this.supabaseService.writeLog(data.user.id, 'Đăng nhập vào hệ thống');
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
        const { data: { user } } = await authClient.auth.getUser(accessToken);
        await authClient.auth.setSession({ access_token: accessToken, refresh_token: '' });
        const { error } = await authClient.auth.signOut();
        if (error)
            throw new common_1.InternalServerErrorException(error.message);
        if (user) {
            await this.supabaseService.writeLog(user.id, 'Đăng xuất khỏi hệ thống');
        }
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
    async refreshToken(refreshToken) {
        if (!refreshToken) {
            throw new common_1.UnauthorizedException('Không có refresh token.');
        }
        const authClient = this.supabaseService.getAuthClient();
        const { data, error } = await authClient.auth.refreshSession({ refresh_token: refreshToken });
        if (error || !data.session) {
            throw new common_1.UnauthorizedException('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
        }
        return {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AuthService);
//# sourceMappingURL=auth.service.js.map