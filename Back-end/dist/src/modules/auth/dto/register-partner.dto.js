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
exports.RegisterPartnerDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class RegisterPartnerDto {
    email;
    password;
    ten_doanh_nghiep;
    nguoi_dai_dien;
    ma_so_thue;
}
exports.RegisterPartnerDto = RegisterPartnerDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'partner@example.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RegisterPartnerDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123456' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6, { message: 'Mật khẩu phải từ 6 ký tự trở lên' }),
    __metadata("design:type", String)
], RegisterPartnerDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Công ty Highland Coffee' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterPartnerDto.prototype, "ten_doanh_nghiep", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Nguyễn Văn A' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterPartnerDto.prototype, "nguoi_dai_dien", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '0102030405' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterPartnerDto.prototype, "ma_so_thue", void 0);
//# sourceMappingURL=register-partner.dto.js.map