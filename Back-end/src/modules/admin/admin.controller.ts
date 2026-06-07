import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('api/admin')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Patch('users/:id/ban')
  banUser(@Param('id') id: string) {
    return this.adminService.banUser(id);
  }

  @Patch('users/:id/unban')
  unbanUser(@Param('id') id: string) {
    return this.adminService.unbanUser(id);
  }

  @Get('vouchers/pending')
  getPendingVouchers() {
    return this.adminService.getPendingVouchers();
  }

  @Patch('vouchers/:id/approve')
  approveVoucher(@Param('id') id: string) {
    return this.adminService.approveVoucher(id);
  }

  @Patch('vouchers/:id/reject')
  rejectVoucher(@Param('id') id: string) {
    return this.adminService.rejectVoucher(id);
  }

  // ─── QUẢN TRỊ ĐỐI TÁC ────────────────────────────────────────────────────────

  @Get('partners/pending')
  getPendingPartners() {
    return this.adminService.getPendingPartners();
  }

  @Patch('partners/:maDT/approve')
  approvePartner(@Param('maDT') maDT: string) {
    return this.adminService.approvePartner(maDT);
  }

  @Patch('partners/:maDT/reject')
  rejectPartner(@Param('maDT') maDT: string) {
    return this.adminService.rejectPartner(maDT);
  }

  @Patch('partners/:maDT/lock')
  lockPartner(@Param('maDT') maDT: string) {
    return this.adminService.lockPartner(maDT);
  }

  @Patch('partners/:maDT/unlock')
  unlockPartner(@Param('maDT') maDT: string) {
    return this.adminService.unlockPartner(maDT);
  }

  // ─── QUẢN LÝ KHIẾU NẠI ───────────────────────────────────────────────────────

  @Get('complaints')
  getAllComplaints() {
    return this.adminService.getAllComplaints();
  }

  @Patch('complaints/:maKN/resolve')
  resolveComplaint(
    @Param('maKN') maKN: string,
    @Body('ketQuaXL') ketQuaXL: string,
  ) {
    return this.adminService.resolveComplaint(maKN, ketQuaXL);
  }

  // ─── NHẬT KÝ HỆ THỐNG ────────────────────────────────────────────────────────

  @Get('logs')
  getSystemLogs() {
    return this.adminService.getSystemLogs();
  }

  @Get('orders')
  getAllOrders() {
    return this.adminService.getAllOrders();
  }

  @Get('stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }
}

