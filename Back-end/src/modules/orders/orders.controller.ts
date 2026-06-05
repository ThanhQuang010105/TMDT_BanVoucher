import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { CurrentToken } from '../../common/decorators/current-token.decorator';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@Controller('api/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ── GIỎ HÀNG ──────────────────────────────────────────────────────────────
  // GET  /api/orders/cart          → Xem giỏ hàng
  @Get('cart')
  getCart(@CurrentToken() token: string) {
    return this.ordersService.getCart(token);
  }

  // POST /api/orders/cart          → Thêm vào giỏ
  @Post('cart')
  addToCart(
    @CurrentToken() token: string,
    @Body() dto: AddToCartDto,
  ) {
    return this.ordersService.addToCart(token, dto);
  }

  // DELETE /api/orders/cart/:maCtgh → Xóa khỏi giỏ
  @Delete('cart/:maCtgh')
  removeFromCart(
    @CurrentToken() token: string,
    @Param('maCtgh') maCtgh: string,
  ) {
    return this.ordersService.removeFromCart(token, maCtgh);
  }

  // ── ĐẶT HÀNG ──────────────────────────────────────────────────────────────
  // POST /api/orders               → Tạo đơn hàng & thanh toán mô phỏng
  @Post()
  createOrder(
    @CurrentToken() token: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(token, dto);
  }

  // ── LỊCH SỬ ĐƠN HÀNG ─────────────────────────────────────────────────────
  // GET /api/orders/history        → Lịch sử đơn hàng
  @Get('history')
  getOrderHistory(@CurrentToken() token: string) {
    return this.ordersService.getOrderHistory(token);
  }

  // ── VÍ VOUCHER (MY VOUCHERS) ──────────────────────────────────────────────
  // GET /api/orders/my-vouchers?trang_thai=chua_su_dung → Ví voucher với bộ lọc tab
  @Get('my-vouchers')
  getMyVouchers(
    @CurrentToken() token: string,
    @Query('trang_thai') trangThai?: string,
  ) {
    return this.ordersService.getMyVouchers(token, trangThai);
  }

  // GET /api/orders/my-vouchers/:maVoucherCode → Chi tiết 1 mã voucher (có QR)
  @Get('my-vouchers/:maVoucherCode')
  getVoucherCodeDetail(
    @CurrentToken() token: string,
    @Param('maVoucherCode') maVoucherCode: string,
  ) {
    return this.ordersService.getVoucherCodeDetail(token, maVoucherCode);
  }

  // ── ĐÁNH GIÁ ─────────────────────────────────────────────────────────────
  // POST /api/orders/reviews       → Gửi đánh giá voucher
  @Post('reviews')
  createReview(
    @CurrentToken() token: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.ordersService.createReview(token, dto);
  }
}
