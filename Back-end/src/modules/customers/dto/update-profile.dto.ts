import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn B', description: 'Họ và tên mới' })
  @IsString()
  @IsOptional()
  ho_ten?: string;

  @ApiPropertyOptional({ example: '0909999888', description: 'Số điện thoại mới' })
  @IsString()
  @IsOptional()
  sdt?: string;

  @ApiPropertyOptional({ example: '456 Nguyễn Trãi, Q.5, TP.HCM', description: 'Địa chỉ mới' })
  @IsString()
  @IsOptional()
  dia_chi?: string;
}
