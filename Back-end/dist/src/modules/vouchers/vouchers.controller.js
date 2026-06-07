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
exports.VouchersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const vouchers_service_1 = require("./vouchers.service");
const search_voucher_dto_1 = require("./dto/search-voucher.dto");
const create_voucher_dto_1 = require("./dto/create-voucher.dto");
const create_branch_dto_1 = require("./dto/create-branch.dto");
const update_branch_dto_1 = require("./dto/update-branch.dto");
const supabase_auth_guard_1 = require("../../common/guards/supabase-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let VouchersController = class VouchersController {
    vouchersService;
    constructor(vouchersService) {
        this.vouchersService = vouchersService;
    }
    getHomepage() {
        return this.vouchersService.getHomepageData();
    }
    getCategories() {
        return this.vouchersService.getCategories();
    }
    getPhanLoai() {
        return this.vouchersService.getPhanLoai();
    }
    searchVouchers(dto) {
        return this.vouchersService.searchVouchers(dto);
    }
    getVoucherDetail(maVoucher) {
        return this.vouchersService.getVoucherDetail(maVoucher);
    }
    getAllVouchers(userId) {
        return this.vouchersService.getAllVouchers(userId);
    }
    searchVoucherForAdmin(userId, query) {
        return this.vouchersService.searchVoucherForAdmin(query, userId);
    }
    getBranches(maDT) {
        return this.vouchersService.getBranches(maDT);
    }
    create(userId, dto) {
        return this.vouchersService.createVoucher(dto, userId);
    }
    submitVoucher(userId, id) {
        return this.vouchersService.submitVoucher(id, userId);
    }
    approveVoucher(userId, id) {
        return this.vouchersService.approveVoucher(id, userId);
    }
    rejectVoucher(userId, id) {
        return this.vouchersService.rejectVoucher(id, userId);
    }
    uploadBanner(file) {
        return this.vouchersService.uploadBanner(file);
    }
    update(userId, id, payload) {
        return this.vouchersService.updateVoucher(id, payload, userId);
    }
    remove(userId, id) {
        return this.vouchersService.removeVoucher(id, userId);
    }
    createBranch(dto) {
        return this.vouchersService.createBranch(dto);
    }
    updateBranch(maCN, dto) {
        return this.vouchersService.updateBranch(maCN, dto);
    }
    deleteBranch(maCN) {
        return this.vouchersService.deleteBranch(maCN);
    }
};
exports.VouchersController = VouchersController;
__decorate([
    (0, common_1.Get)('homepage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], VouchersController.prototype, "getHomepage", null);
__decorate([
    (0, common_1.Get)('categories'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], VouchersController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Get)('phan-loai'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], VouchersController.prototype, "getPhanLoai", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_voucher_dto_1.SearchVoucherDto]),
    __metadata("design:returntype", void 0)
], VouchersController.prototype, "searchVouchers", null);
__decorate([
    (0, common_1.Get)(':maVoucher'),
    __param(0, (0, common_1.Param)('maVoucher')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VouchersController.prototype, "getVoucherDetail", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'doi_tac'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VouchersController.prototype, "getAllVouchers", null);
__decorate([
    (0, common_1.Get)('admin/search'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin', 'doi_tac'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], VouchersController.prototype, "searchVoucherForAdmin", null);
__decorate([
    (0, common_1.Get)('admin/branches/:maDT'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('doi_tac', 'admin'),
    __param(0, (0, common_1.Param)('maDT')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VouchersController.prototype, "getBranches", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('doi_tac'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_voucher_dto_1.CreateVoucherDto]),
    __metadata("design:returntype", void 0)
], VouchersController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/submit'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('doi_tac'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], VouchersController.prototype, "submitVoucher", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], VouchersController.prototype, "approveVoucher", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], VouchersController.prototype, "rejectVoucher", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('doi_tac'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], VouchersController.prototype, "uploadBanner", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('doi_tac'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], VouchersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('doi_tac'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], VouchersController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('admin/branches'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('doi_tac', 'admin'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_branch_dto_1.CreateBranchDto]),
    __metadata("design:returntype", void 0)
], VouchersController.prototype, "createBranch", null);
__decorate([
    (0, common_1.Put)('admin/branches/:maCN'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('doi_tac', 'admin'),
    __param(0, (0, common_1.Param)('maCN')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_branch_dto_1.UpdateBranchDto]),
    __metadata("design:returntype", void 0)
], VouchersController.prototype, "updateBranch", null);
__decorate([
    (0, common_1.Delete)('admin/branches/:maCN'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('doi_tac', 'admin'),
    __param(0, (0, common_1.Param)('maCN')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VouchersController.prototype, "deleteBranch", null);
exports.VouchersController = VouchersController = __decorate([
    (0, swagger_1.ApiTags)('Vouchers'),
    (0, common_1.Controller)('api/vouchers'),
    __metadata("design:paramtypes", [vouchers_service_1.VouchersService])
], VouchersController);
//# sourceMappingURL=vouchers.controller.js.map