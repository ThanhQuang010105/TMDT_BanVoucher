import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'nguyenvana@gmail.com', description: 'Email đăng ký tài khoản' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456', description: 'Mật khẩu tối thiểu 6 ký tự' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ và tên đầy đủ' })
  @IsString()
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  ho_ten: string;

  @ApiPropertyOptional({ example: '0901234567', description: 'Số điện thoại (không bắt buộc)' })
  @IsString()
  @IsOptional()
  sdt?: string;

  @ApiPropertyOptional({ example: '123 Lý Thường Kiệt, Q.10, TP.HCM', description: 'Địa chỉ (không bắt buộc)' })
  @IsString()
  @IsOptional()
  dia_chi?: string;
}
