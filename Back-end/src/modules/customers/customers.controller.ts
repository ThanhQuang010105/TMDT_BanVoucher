import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CurrentToken } from '../../common/decorators/current-token.decorator';

@ApiTags('Customers')
@ApiBearerAuth('access-token')
@Controller('api/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  // GET /api/customers/me  → Lấy hồ sơ cá nhân
  @Get('me')
  getMyProfile(@CurrentToken() token: string) {
    return this.customersService.getMyProfile(token);
  }

  // PATCH /api/customers/me  → Cập nhật hồ sơ cá nhân
  @Patch('me')
  updateMyProfile(
    @CurrentToken() token: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.customersService.updateMyProfile(token, dto);
  }

  // POST /api/customers/me/change-password  → Đổi mật khẩu
  @Post('me/change-password')
  changePassword(
    @CurrentToken() token: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.customersService.changePassword(token, dto);
  }
}