import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { RedemptionService } from './redemption.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/redemption')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class RedemptionController {
  constructor(private readonly redemptionService: RedemptionService) {}

  // Kiểm tra mã voucher (đối tác)
  @Post('verify')
  @Roles('doi_tac')
  verifyVoucherCode(@Body() body: { ma_voucher_code: string; ma_cn: string }) {
    return this.redemptionService.verifyVoucherCode(body.ma_voucher_code, body.ma_cn);
  }

  // Xác nhận sử dụng (đối tác)
  @Post('redeem')
  @Roles('doi_tac')
  redeemVoucherCode(
    @CurrentUser('id') userId: string,
    @Body() body: { ma_voucher_code: string; ma_cn: string },
  ) {
    return this.redemptionService.redeemVoucherCode(body.ma_voucher_code, body.ma_cn, userId);
  }

  // Lịch sử mua hàng (khách hàng)
  @Get('history/:ma_kh')
  @Roles('khach_hang')
  getPurchaseHistory(@Param('ma_kh') ma_kh: string) {
    return this.redemptionService.getPurchaseHistory(ma_kh);
  }

  // Thống kê doanh thu cho đối tác
  @Get('stats/partner/:ma_dt')
  @Roles('doi_tac')
  getPartnerStats(@Param('ma_dt') ma_dt: string) {
    return this.redemptionService.getPartnerStats(ma_dt);
  }

  // Thống kê doanh thu toàn sàn cho admin
  @Get('stats/admin')
  @Roles('admin')
  getAdminStats() {
    return this.redemptionService.getAdminStats();
  }
}
