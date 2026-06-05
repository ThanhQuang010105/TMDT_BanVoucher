import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CustomerProfileDto {
  @IsNotEmpty()
  @IsString()
  full_name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone_number?: string;
}