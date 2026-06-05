import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @ApiProperty({
    example: 'chuyen_khoan',
    description: 'Phương thức thanh toán mô phỏng',
    enum: ['tien_mat', 'chuyen_khoan', 'vi_dien_tu'],
  })
  @IsString()
  @IsNotEmpty({ message: 'Phương thức thanh toán không được để trống' })
  @IsIn(['tien_mat', 'chuyen_khoan', 'vi_dien_tu'], {
    message: 'Phương thức thanh toán không hợp lệ',
  })
  phuong_thuc_thanh_toan: string;

  @ApiPropertyOptional({ example: 'Quà tặng sinh nhật bạn thân', description: 'Tên gợi nhớ cho đơn hàng (không bắt buộc)' })
  @IsString()
  @IsOptional()
  ten_don_hang?: string;
}
