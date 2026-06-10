import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { CurrentToken } from '../../common/decorators/current-token.decorator';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ── GIỎ HÀNG ──────────────────────────────────────────────────────────────
  @Get('cart')
  getCart(@CurrentToken() token: string) {
    return this.ordersService.getCart(token);
  }

  @Post('cart')
  addToCart(
    @CurrentToken() token: string,
    @Body() dto: AddToCartDto,
  ) {
    return this.ordersService.addToCart(token, dto);
  }

  @Delete('cart/:maCtgh')
  removeFromCart(
    @CurrentToken() token: string,
    @Param('maCtgh') maCtgh: string,
  ) {
    return this.ordersService.removeFromCart(token, maCtgh);
  }

  @Put('cart/:maCtgh')
  updateCartQuantity(
    @CurrentToken() token: string,
    @Param('maCtgh') maCtgh: string,
    @Body('so_luong_mua') soLuongMua: number,
  ) {
    return this.ordersService.updateCartQuantity(token, maCtgh, soLuongMua);
  }

  // ── ĐẶT HÀNG (Luồng cũ: MoMo, VNPay) ────────────────────────────────────
  @Post()
  createOrder(
    @CurrentToken() token: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(token, dto);
  }

  @Post(':maDh/cancel')
  cancelOrder(
    @CurrentToken() token: string,
    @Param('maDh') maDh: string,
  ) {
    return this.ordersService.cancelOrder(token, maDh);
  }

  // ── LỊCH SỬ ĐƠN HÀNG ─────────────────────────────────────────────────────
  @Get('history')
  getOrderHistory(@CurrentToken() token: string) {
    return this.ordersService.getOrderHistory(token);
  }

  // ── VÍ VOUCHER ────────────────────────────────────────────────────────────
  @Get('my-vouchers')
  getMyVouchers(
    @CurrentToken() token: string,
    @Query('trang_thai') trangThai?: string,
  ) {
    return this.ordersService.getMyVouchers(token, trangThai);
  }

  @Get('my-vouchers/:maVoucherCode')
  getVoucherCodeDetail(
    @CurrentToken() token: string,
    @Param('maVoucherCode') maVoucherCode: string,
  ) {
    return this.ordersService.getVoucherCodeDetail(token, maVoucherCode);
  }

  // ── ĐÁNH GIÁ ─────────────────────────────────────────────────────────────
  @Post('reviews')
  createReview(
    @CurrentToken() token: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.ordersService.createReview(token, dto);
  }

  @Delete('reviews/:maDg')
  deleteReview(
    @CurrentToken() token: string,
    @Param('maDg') maDg: string,
  ) {
    return this.ordersService.deleteReview(token, maDg);
  }

  // ── KHIẾU NẠI ────────────────────────────────────────────────────────────
  @Post('complaints')
  createComplaint(
    @CurrentToken() token: string,
    @Body() dto: CreateComplaintDto,
  ) {
    return this.ordersService.createComplaint(token, dto);
  }

  // ── STRIPE CHECKOUT ───────────────────────────────────────────────────────
  // GET /api/orders/stripe/config  → Trả về Stripe Public Key
  @Get('stripe/config')
  getStripeConfig() {
    return this.ordersService.getStripeConfig();
  }

  // POST /api/orders/stripe/create-checkout → Tạo Stripe Checkout Session, trả về URL
  @Post('stripe/create-checkout')
  async createStripeCheckout(
    @CurrentToken() token: string,
    @Body() body: { email_nhan_voucher?: string; ma_ctgh_list?: string[] },
  ) {
    const result = await this.ordersService.createStripeCheckoutSession(
      token,
      body.email_nhan_voucher,
      body.ma_ctgh_list,
    );
    // Trả về JSON để frontend dùng fetch() rồi redirect tự tay
    return { success: true, url: result.url };
  }

  // GET /api/orders/stripe/success → Stripe callback sau khi thanh toán thành công
  // Stripe gọi URL này không có Bearer token → không dùng @CurrentToken
  @Get('stripe/success')
  async stripeSuccess(
    @Query('session_id') sessionId: string,
    @Res() res: Response,
  ) {
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    try {
      // Gọi xử lý tạo đơn hàng trực tiếp ở Backend
      const result = await this.ordersService.handleStripeSuccess('', sessionId);
      return res.redirect(`${frontendUrl}/order-success?stripe=1&ma_dh=${result.ma_dh}&total=${result.tong_tien}`);
    } catch (err) {
      // Nếu có lỗi, chuyển hướng về trang lỗi hoặc checkout kèm báo lỗi
      return res.redirect(`${frontendUrl}/checkout?stripe_error=${encodeURIComponent(err.message || 'Lỗi thanh toán')}`);
    }
  }

  // POST /api/orders/stripe/confirm → Frontend gọi sau khi redirect về, kèm token của user
  @Post('stripe/confirm')
  async stripeConfirm(
    @CurrentToken() token: string,
    @Query('session_id') sessionId: string,
  ) {
    return this.ordersService.handleStripeSuccess(token, sessionId);
  }

  // GET /api/orders/stripe/cancel  → Stripe callback khi người dùng huỷ
  @Get('stripe/cancel')
  stripeCancel(@Res() res: Response) {
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    return res.redirect(`${frontendUrl}/checkout?stripe_cancelled=1`);
  }
}
