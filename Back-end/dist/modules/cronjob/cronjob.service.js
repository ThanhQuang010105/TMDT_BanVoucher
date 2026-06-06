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
var CronjobService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronjobService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const supabase_service_1 = require("../../supabase/supabase.service");
let CronjobService = CronjobService_1 = class CronjobService {
    supabase;
    logger = new common_1.Logger(CronjobService_1.name);
    constructor(supabase) {
        this.supabase = supabase;
    }
    async expireVouchers() {
        this.logger.log('Cronjob: Đang quét voucher hết hạn...');
        const now = new Date().toISOString();
        const { data, error } = await this.supabase
            .getClient()
            .from('voucher')
            .update({ trang_thai: 'expired' })
            .eq('trang_thai', 'active')
            .lt('ngay_kt', now)
            .select();
        if (error) {
            this.logger.error('Cronjob lỗi:', error.message);
            return;
        }
        this.logger.log(`Cronjob: Đã chuyển ${data?.length ?? 0} voucher sang expired`);
    }
};
exports.CronjobService = CronjobService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronjobService.prototype, "expireVouchers", null);
exports.CronjobService = CronjobService = CronjobService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], CronjobService);
//# sourceMappingURL=cronjob.service.js.map