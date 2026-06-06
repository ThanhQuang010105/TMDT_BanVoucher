import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateComplaintDto {
  @ApiProperty({ example: 'VC-12345678' })
  @IsString()
  @IsNotEmpty()
  ma_voucher!: string;

  @ApiProperty({ example: 'Voucher không thể áp dụng tại cửa hàng mặc dù còn hạn' })
  @IsString()
  @IsNotEmpty()
  ly_do!: string;
}
