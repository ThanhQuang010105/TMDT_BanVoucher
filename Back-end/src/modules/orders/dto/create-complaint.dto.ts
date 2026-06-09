import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateComplaintDto {
  @ApiProperty({ example: 'VC-12345678' })
  @IsString()
  @IsOptional()
  ma_voucher?: string;

  @ApiProperty({ example: 'VC-12345678' })
  @IsString()
  @IsNotEmpty()
  ma_voucher_code!: string;

  @ApiProperty({ example: 'Voucher không thể áp dụng tại cửa hàng mặc dù còn hạn' })
  @IsString()
  @IsNotEmpty()
  ly_do!: string;
}
