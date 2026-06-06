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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedemptionController = void 0;
const common_1 = require("@nestjs/common");
const redemption_service_1 = require("./redemption.service");
const supabase_auth_guard_1 = require("../../common/guards/supabase-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let RedemptionController = class RedemptionController {
    redemptionService;
    constructor(redemptionService) {
        this.redemptionService = redemptionService;
    }
    verifyVoucherCode(body) {
        return this.redemptionService.verifyVoucherCode(body.ma_voucher_code, body.ma_cn);
    }
    redeemVoucherCode(userId, body) {
        return this.redemptionService.redeemVoucherCode(body.ma_voucher_code, body.ma_cn, userId);
    }
    getPurchaseHistory(ma_kh) {
        return this.redemptionService.getPurchaseHistory(ma_kh);
    }
    getPartnerStats(ma_dt) {
        return this.redemptionService.getPartnerStats(ma_dt);
    }
    getAdminStats() {
        return this.redemptionService.getAdminStats();
    }
};
exports.RedemptionController = RedemptionController;
__decorate([
    (0, common_1.Post)('verify'),
    (0, roles_decorator_1.Roles)('doi_tac'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RedemptionController.prototype, "verifyVoucherCode", null);
__decorate([
    (0, common_1.Post)('redeem'),
    (0, roles_decorator_1.Roles)('doi_tac'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RedemptionController.prototype, "redeemVoucherCode", null);
__decorate([
    (0, common_1.Get)('history/:ma_kh'),
    (0, roles_decorator_1.Roles)('khach_hang'),
    __param(0, (0, common_1.Param)('ma_kh')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RedemptionController.prototype, "getPurchaseHistory", null);
__decorate([
    (0, common_1.Get)('stats/partner/:ma_dt'),
    (0, roles_decorator_1.Roles)('doi_tac'),
    __param(0, (0, common_1.Param)('ma_dt')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RedemptionController.prototype, "getPartnerStats", null);
__decorate([
    (0, common_1.Get)('stats/admin'),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RedemptionController.prototype, "getAdminStats", null);
exports.RedemptionController = RedemptionController = __decorate([
    (0, common_1.Controller)('api/redemption'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [redemption_service_1.RedemptionService])
], RedemptionController);
//# sourceMappingURL=redemption.controller.js.map