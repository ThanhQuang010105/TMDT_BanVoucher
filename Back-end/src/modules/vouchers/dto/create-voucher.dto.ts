import { IsDateString, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVoucherDto {
  @ApiProperty({ example: 'Voucher giảm giá Highland' })
  @IsString()
  TenVoucher!: string;

  @ApiProperty({ example: 'PL01' })
  @IsString()
  MaPL!: string;

  @ApiProperty({ example: 'TAXON01' })
  @IsString()
  MaTaxon!: string;

  @ApiProperty({ example: 'Mô tả voucher' })
  @IsString()
  MoTa!: string;

  @ApiProperty({ example: 'DT01' })
  @IsString()
  MaDT!: string;

  @ApiProperty({ example: 'https://example.com/banner.jpg' })
  @IsString()
  bannerUrl!: string;

  @ApiProperty({ example: 100000 })
  @IsNumber()
  GiaGoc!: number;

  @ApiProperty({ example: 80000 })
  @IsNumber()
  GiaBan!: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  SoLuongPhatHanh!: number;

  @ApiProperty({ example: '2026-06-07T00:00:00Z' })
  @IsDateString()
  NgayBD!: Date;

  @ApiProperty({ example: '2026-07-07T00:00:00Z' })
  @IsDateString()
  NgayKT!: Date;
}
