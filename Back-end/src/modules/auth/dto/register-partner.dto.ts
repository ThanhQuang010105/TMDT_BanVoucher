import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterPartnerDto {
  @ApiProperty({ example: 'partner@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải từ 6 ký tự trở lên' })
  password!: string;

  @ApiProperty({ example: 'Công ty Highland Coffee' })
  @IsString()
  ten_doanh_nghiep!: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @IsOptional()
  nguoi_dai_dien?: string;

  @ApiProperty({ example: '0102030405' })
  @IsString()
  @IsOptional()
  ma_so_thue?: string;
}
