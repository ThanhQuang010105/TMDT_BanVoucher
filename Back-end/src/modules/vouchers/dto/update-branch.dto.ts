import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBranchDto {
  @ApiProperty({ example: 'Chi nhánh Quận 1 (Cập nhật)' })
  @IsString()
  @IsOptional()
  ten_chi_nhanh?: string;

  @ApiProperty({ example: '456 Lê Lợi, Quận 1, TP.HCM' })
  @IsString()
  @IsOptional()
  dia_chi?: string;

  @ApiProperty({ example: 'active' })
  @IsString()
  @IsOptional()
  trang_thai_hoat_dong?: string;
}
