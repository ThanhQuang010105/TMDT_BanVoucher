import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBranchDto {
  @ApiProperty({ example: 'DT01' })
  @IsString()
  ma_dt!: string;

  @ApiProperty({ example: 'Chi nhánh Quận 1' })
  @IsString()
  ten_chi_nhanh!: string;

  @ApiProperty({ example: '123 Nguyễn Huệ, Quận 1, TP.HCM' })
  @IsString()
  @IsOptional()
  dia_chi?: string;

  @ApiProperty({ example: 'active' })
  @IsString()
  @IsOptional()
  trang_thai_hoat_dong?: string;
}
