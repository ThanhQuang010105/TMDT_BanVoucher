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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const admin_service_1 = require("./admin.service");
const supabase_auth_guard_1 = require("../../common/guards/supabase-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    getAllUsers() {
        return this.adminService.getAllUsers();
    }
    banUser(id) {
        return this.adminService.banUser(id);
    }
    unbanUser(id) {
        return this.adminService.unbanUser(id);
    }
    getPendingVouchers() {
        return this.adminService.getPendingVouchers();
    }
    approveVoucher(id) {
        return this.adminService.approveVoucher(id);
    }
    rejectVoucher(id) {
        return this.adminService.rejectVoucher(id);
    }
    getPendingPartners() {
        return this.adminService.getPendingPartners();
    }
    approvePartner(maDT) {
        return this.adminService.approvePartner(maDT);
    }
    rejectPartner(maDT) {
        return this.adminService.rejectPartner(maDT);
    }
    lockPartner(maDT) {
        return this.adminService.lockPartner(maDT);
    }
    unlockPartner(maDT) {
        return this.adminService.unlockPartner(maDT);
    }
    getAllComplaints() {
        return this.adminService.getAllComplaints();
    }
    resolveComplaint(maKN, ketQuaXL) {
        return this.adminService.resolveComplaint(maKN, ketQuaXL);
    }
    getSystemLogs() {
        return this.adminService.getSystemLogs();
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('users'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Patch)('users/:id/ban'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "banUser", null);
__decorate([
    (0, common_1.Patch)('users/:id/unban'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "unbanUser", null);
__decorate([
    (0, common_1.Get)('vouchers/pending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getPendingVouchers", null);
__decorate([
    (0, common_1.Patch)('vouchers/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "approveVoucher", null);
__decorate([
    (0, common_1.Patch)('vouchers/:id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "rejectVoucher", null);
__decorate([
    (0, common_1.Get)('partners/pending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getPendingPartners", null);
__decorate([
    (0, common_1.Patch)('partners/:maDT/approve'),
    __param(0, (0, common_1.Param)('maDT')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "approvePartner", null);
__decorate([
    (0, common_1.Patch)('partners/:maDT/reject'),
    __param(0, (0, common_1.Param)('maDT')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "rejectPartner", null);
__decorate([
    (0, common_1.Patch)('partners/:maDT/lock'),
    __param(0, (0, common_1.Param)('maDT')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "lockPartner", null);
__decorate([
    (0, common_1.Patch)('partners/:maDT/unlock'),
    __param(0, (0, common_1.Param)('maDT')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "unlockPartner", null);
__decorate([
    (0, common_1.Get)('complaints'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getAllComplaints", null);
__decorate([
    (0, common_1.Patch)('complaints/:maKN/resolve'),
    __param(0, (0, common_1.Param)('maKN')),
    __param(1, (0, common_1.Body)('ketQuaXL')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "resolveComplaint", null);
__decorate([
    (0, common_1.Get)('logs'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getSystemLogs", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('api/admin'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map