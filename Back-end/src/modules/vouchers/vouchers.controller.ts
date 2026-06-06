import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { VouchersService } from './vouchers.service';
import { SearchVoucherDto } from './dto/search-voucher.dto';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';


@ApiTags('Vouchers')
@Controller('api/vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  // ─── KHÁCH HÀNG (PUBLIC / CUSTOMER) ──────────────────────────────────────────

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

  // ─── ĐỐI TÁC / QUẢN TRỊ (PARTNER / ADMIN) ─────────────────────────────────────

  // Lấy toàn bộ danh sách voucher (Admin / Đối tác)
  @Get('admin/all')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin', 'doi_tac')
  getAllVouchers() {
    return this.vouchersService.getAllVouchers();
  }

  // Tìm kiếm lọc nâng cao cho Admin / Đối tác
  @Get('admin/search')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin', 'doi_tac')
  searchVoucherForAdmin(@Query() query: any) {
    return this.vouchersService.searchVoucherForAdmin(query);
  }

  // Lấy chi nhánh của đối tác
  @Get('admin/branches/:maDT')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('doi_tac', 'admin')
  getBranches(@Param('maDT') maDT: string) {
    return this.vouchersService.getBranches(maDT);
  }

  // Tạo voucher nháp (Đối tác)
  @Post()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('doi_tac')
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateVoucherDto,
  ) {
    return this.vouchersService.createVoucher(dto, userId);
  }

  // Gửi duyệt voucher (Đối tác)
  @Post(':id/submit')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('doi_tac')
  submitVoucher(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.vouchersService.submitVoucher(id, userId);
  }

  // Phê duyệt voucher (Admin)
  @Post(':id/approve')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  approveVoucher(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.vouchersService.approveVoucher(id, userId);
  }

  // Từ chối duyệt voucher (Admin)
  @Post(':id/reject')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  rejectVoucher(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.vouchersService.rejectVoucher(id, userId);
  }

  // Tải ảnh banner lên Storage (Đối tác)
  @Post('upload')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('doi_tac')
  @UseInterceptors(FileInterceptor('file'))
  uploadBanner(@UploadedFile() file: any) {
    return this.vouchersService.uploadBanner(file);
  }

  // Cập nhật thông tin voucher (Đối tác)
  @Put(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('doi_tac')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() payload: any,
  ) {
    return this.vouchersService.updateVoucher(id, payload, userId);
  }

  // Xóa voucher (Đối tác)
  @Delete(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('doi_tac')
  remove(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.vouchersService.removeVoucher(id, userId);
  }

  // ─── CRUD CHI NHÁNH (BR-PAR-01) ──────────────────────────────────────────────

  // Thêm chi nhánh mới
  @Post('admin/branches')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('doi_tac', 'admin')
  createBranch(@Body() dto: CreateBranchDto) {
    return this.vouchersService.createBranch(dto);
  }

  // Cập nhật thông tin chi nhánh
  @Put('admin/branches/:maCN')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('doi_tac', 'admin')
  updateBranch(@Param('maCN') maCN: string, @Body() dto: UpdateBranchDto) {
    return this.vouchersService.updateBranch(maCN, dto);
  }

  // Xóa chi nhánh
  @Delete('admin/branches/:maCN')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('doi_tac', 'admin')
  deleteBranch(@Param('maCN') maCN: string) {
    return this.vouchersService.deleteBranch(maCN);
  }
}

