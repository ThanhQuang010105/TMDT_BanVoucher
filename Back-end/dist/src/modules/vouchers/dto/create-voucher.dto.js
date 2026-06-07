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
exports.CreateVoucherDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateVoucherDto {
    TenVoucher;
    MaPL;
    MaTaxon;
    MoTa;
    MaDT;
    bannerUrl;
    GiaGoc;
    GiaBan;
    SoLuongPhatHanh;
    NgayBD;
    NgayKT;
}
exports.CreateVoucherDto = CreateVoucherDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Voucher giảm giá Highland' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVoucherDto.prototype, "TenVoucher", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'PL01' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVoucherDto.prototype, "MaPL", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'TAXON01' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVoucherDto.prototype, "MaTaxon", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Mô tả voucher' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVoucherDto.prototype, "MoTa", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'DT01' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVoucherDto.prototype, "MaDT", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://example.com/banner.jpg' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateVoucherDto.prototype, "bannerUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 100000 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateVoucherDto.prototype, "GiaGoc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 80000 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateVoucherDto.prototype, "GiaBan", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 100 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateVoucherDto.prototype, "SoLuongPhatHanh", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-06-07T00:00:00Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Date)
], CreateVoucherDto.prototype, "NgayBD", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-07-07T00:00:00Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Date)
], CreateVoucherDto.prototype, "NgayKT", void 0);
//# sourceMappingURL=create-voucher.dto.js.map