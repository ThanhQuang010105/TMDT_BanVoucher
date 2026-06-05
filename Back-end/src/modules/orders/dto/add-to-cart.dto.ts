import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({ example: 'VOUCHER-001', description: 'Mã voucher muốn thêm vào giỏ hàng' })
  @IsString()
  @IsNotEmpty()
  ma_voucher: string;

  @ApiProperty({ example: 1, description: 'Số lượng muốn mua (tối thiểu 1)', minimum: 1 })
  @IsInt()
  @Min(1)
  so_luong_mua: number;
}
