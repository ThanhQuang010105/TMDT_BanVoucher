import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: '123456', description: 'Mật khẩu hiện tại' })
  @IsString()
  @IsNotEmpty()
  old_password: string;

  @ApiProperty({ example: 'matkhaumoi789', description: 'Mật khẩu mới (ít nhất 6 ký tự)' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  new_password: string;
}
