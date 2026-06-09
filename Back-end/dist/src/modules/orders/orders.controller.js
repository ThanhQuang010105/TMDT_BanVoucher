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
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const orders_service_1 = require("./orders.service");
const add_to_cart_dto_1 = require("./dto/add-to-cart.dto");
const create_order_dto_1 = require("./dto/create-order.dto");
const create_review_dto_1 = require("./dto/create-review.dto");
const create_complaint_dto_1 = require("./dto/create-complaint.dto");
const current_token_decorator_1 = require("../../common/decorators/current-token.decorator");
let OrdersController = class OrdersController {
    ordersService;
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    getCart(token) {
        return this.ordersService.getCart(token);
    }
    addToCart(token, dto) {
        return this.ordersService.addToCart(token, dto);
    }
    removeFromCart(token, maCtgh) {
        return this.ordersService.removeFromCart(token, maCtgh);
    }
    createOrder(token, dto) {
        return this.ordersService.createOrder(token, dto);
    }
    cancelOrder(token, maDh) {
        return this.ordersService.cancelOrder(token, maDh);
    }
    getOrderHistory(token) {
        return this.ordersService.getOrderHistory(token);
    }
    getMyVouchers(token, trangThai) {
        return this.ordersService.getMyVouchers(token, trangThai);
    }
    getVoucherCodeDetail(token, maVoucherCode) {
        return this.ordersService.getVoucherCodeDetail(token, maVoucherCode);
    }
    createReview(token, dto) {
        return this.ordersService.createReview(token, dto);
    }
    deleteReview(token, maDg) {
        return this.ordersService.deleteReview(token, maDg);
    }
    createComplaint(token, dto) {
        return this.ordersService.createComplaint(token, dto);
    }
    getStripeConfig() {
        return this.ordersService.getStripeConfig();
    }
    async createStripeCheckout(token, body) {
        const result = await this.ordersService.createStripeCheckoutSession(token, body.email_nhan_voucher, body.ma_ctgh_list);
        return { success: true, url: result.url };
    }
    async stripeSuccess(token, sessionId) {
        const result = await this.ordersService.handleStripeSuccess(token, sessionId);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return `<html><head><meta http-equiv="refresh" content="0;url=${frontendUrl}/order-success?stripe=1&ma_dh=${result.ma_dh}&total=${result.tong_tien}"></head><body>Đang chuyển hướng...</body></html>`;
    }
    stripeCancel() {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return `<html><head><meta http-equiv="refresh" content="0;url=${frontendUrl}/checkout?stripe_cancelled=1"></head><body>Đang chuyển hướng...</body></html>`;
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Get)('cart'),
    __param(0, (0, current_token_decorator_1.CurrentToken)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getCart", null);
__decorate([
    (0, common_1.Post)('cart'),
    __param(0, (0, current_token_decorator_1.CurrentToken)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_to_cart_dto_1.AddToCartDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "addToCart", null);
__decorate([
    (0, common_1.Delete)('cart/:maCtgh'),
    __param(0, (0, current_token_decorator_1.CurrentToken)()),
    __param(1, (0, common_1.Param)('maCtgh')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "removeFromCart", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_token_decorator_1.CurrentToken)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_order_dto_1.CreateOrderDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Post)(':maDh/cancel'),
    __param(0, (0, current_token_decorator_1.CurrentToken)()),
    __param(1, (0, common_1.Param)('maDh')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "cancelOrder", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, current_token_decorator_1.CurrentToken)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getOrderHistory", null);
__decorate([
    (0, common_1.Get)('my-vouchers'),
    __param(0, (0, current_token_decorator_1.CurrentToken)()),
    __param(1, (0, common_1.Query)('trang_thai')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getMyVouchers", null);
__decorate([
    (0, common_1.Get)('my-vouchers/:maVoucherCode'),
    __param(0, (0, current_token_decorator_1.CurrentToken)()),
    __param(1, (0, common_1.Param)('maVoucherCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getVoucherCodeDetail", null);
__decorate([
    (0, common_1.Post)('reviews'),
    __param(0, (0, current_token_decorator_1.CurrentToken)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_review_dto_1.CreateReviewDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "createReview", null);
__decorate([
    (0, common_1.Delete)('reviews/:maDg'),
    __param(0, (0, current_token_decorator_1.CurrentToken)()),
    __param(1, (0, common_1.Param)('maDg')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "deleteReview", null);
__decorate([
    (0, common_1.Post)('complaints'),
    __param(0, (0, current_token_decorator_1.CurrentToken)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_complaint_dto_1.CreateComplaintDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "createComplaint", null);
__decorate([
    (0, common_1.Get)('stripe/config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getStripeConfig", null);
__decorate([
    (0, common_1.Post)('stripe/create-checkout'),
    __param(0, (0, current_token_decorator_1.CurrentToken)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "createStripeCheckout", null);
__decorate([
    (0, common_1.Get)('stripe/success'),
    __param(0, (0, current_token_decorator_1.CurrentToken)()),
    __param(1, (0, common_1.Query)('session_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "stripeSuccess", null);
__decorate([
    (0, common_1.Get)('stripe/cancel'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "stripeCancel", null);
exports.OrdersController = OrdersController = __decorate([
    (0, swagger_1.ApiTags)('Orders'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.Controller)('api/orders'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map