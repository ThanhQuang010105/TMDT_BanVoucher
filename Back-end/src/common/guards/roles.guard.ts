import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private supabase: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('Không tìm thấy thông tin xác thực người dùng');
    }

    // Lấy thông tin vai trò trực tiếp từ bảng tai_khoan để đảm bảo bảo mật và đồng bộ DB
    const { data: taiKhoan, error } = await this.supabase
      .getClient()
      .from('tai_khoan')
      .select('vai_tro')
      .eq('ma_tk', userId)
      .single();

    if (error || !taiKhoan) {
      throw new ForbiddenException('Tài khoản không tồn tại trong hệ thống');
    }

    const userRole = taiKhoan.vai_tro;

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        `Yêu cầu quyền: [${requiredRoles.join(', ')}]. Quyền hiện tại: ${userRole ?? 'không xác định'}`,
      );
    }

    return true;
  }
}
