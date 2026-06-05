import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VouchersService } from './vouchers.service';
import { SearchVoucherDto } from './dto/search-voucher.dto';

@ApiTags('Vouchers')
@Controller('api/vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  // GET /api/vouchers/homepage  → Dữ liệu trang chủ
  @Get('homepage')
  getHomepage() {
    return this.vouchersService.getHomepageData();
  }

  // GET /api/vouchers/categories  → Cây danh mục
  @Get('categories')
  getCategories() {
    return this.vouchersService.getCategories();
  }

  // GET /api/vouchers?keyword=&ma_taxon=&page=  → Tìm kiếm & lọc
  @Get()
  searchVouchers(@Query() dto: SearchVoucherDto) {
    return this.vouchersService.searchVouchers(dto);
  }

  // GET /api/vouchers/:maVoucher  → Chi tiết voucher
  @Get(':maVoucher')
  getVoucherDetail(@Param('maVoucher') maVoucher: string) {
    return this.vouchersService.getVoucherDetail(maVoucher);
  }
}
