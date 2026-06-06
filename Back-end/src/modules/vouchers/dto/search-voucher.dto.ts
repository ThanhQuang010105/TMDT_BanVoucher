import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class SearchVoucherDto {
  @IsString()
  @IsOptional()
  keyword?: string; // Tìm theo tên voucher

  @IsString()
  @IsOptional()
  ma_taxon?: string; // Lọc theo danh mục

  @IsString()
  @IsOptional()
  ma_dt?: string; // Lọc theo đối tác

  @IsNumberString()
  @IsOptional()
  gia_min?: string; // Lọc giá bán tối thiểu

  @IsNumberString()
  @IsOptional()
  gia_max?: string; // Lọc giá bán tối đa

  @IsString()
  @IsOptional()
  hieu_luc?: string; // Lọc theo trạng thái hiệu lực: 'dang_dien_ra' | 'sap_dien_ra' | 'het_han'

  @IsNumberString()
  @IsOptional()
  page?: string; // Số trang (mặc định 1)

  @IsNumberString()
  @IsOptional()
  limit?: string; // Số item mỗi trang (mặc định 12)
}
