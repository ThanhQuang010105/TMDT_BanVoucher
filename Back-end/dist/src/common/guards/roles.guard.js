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
exports.RolesGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const roles_decorator_1 = require("../decorators/roles.decorator");
const supabase_service_1 = require("../../supabase/supabase.service");
let RolesGuard = class RolesGuard {
    reflector;
    supabase;
    constructor(reflector, supabase) {
        this.reflector = reflector;
        this.supabase = supabase;
    }
    async canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride(roles_decorator_1.ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles || requiredRoles.length === 0)
            return true;
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id;
        if (!userId) {
            throw new common_1.ForbiddenException('Không tìm thấy thông tin xác thực người dùng');
        }
        const { data: taiKhoan, error } = await this.supabase
            .getClient()
            .from('tai_khoan')
            .select('vai_tro')
            .eq('ma_tk', userId)
            .single();
        if (error || !taiKhoan) {
            throw new common_1.ForbiddenException('Tài khoản không tồn tại trong hệ thống');
        }
        const userRole = taiKhoan.vai_tro;
        if (!requiredRoles.includes(userRole)) {
            throw new common_1.ForbiddenException(`Yêu cầu quyền: [${requiredRoles.join(', ')}]. Quyền hiện tại: ${userRole ?? 'không xác định'}`);
        }
        return true;
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        supabase_service_1.SupabaseService])
], RolesGuard);
//# sourceMappingURL=roles.guard.js.map