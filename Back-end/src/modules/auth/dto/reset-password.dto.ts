import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Access token nhận được từ link email đặt lại mật khẩu',
  })
  @IsString()
  @IsNotEmpty()
  access_token: string;

  @ApiProperty({ example: 'matkhaumoi123', description: 'Mật khẩu mới (ít nhất 6 ký tự)' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  new_password: string;
}
