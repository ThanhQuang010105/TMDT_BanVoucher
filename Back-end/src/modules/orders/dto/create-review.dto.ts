import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 'VOUCHER-001', description: 'Mã voucher muốn đánh giá (phải đã sử dụng)' })
  @IsString()
  @IsNotEmpty()
  ma_voucher: string;

  @ApiProperty({ example: 5, description: 'Điểm đánh giá từ 1 đến 5 sao', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  diem_so_dg: number;

  @ApiPropertyOptional({ example: 'Voucher rất tốt, nhân viên phục vụ nhiệt tình!', description: 'Nội dung bình luận (không bắt buộc)' })
  @IsString()
  @IsOptional()
  noi_dung_binh_luan?: string;
}
