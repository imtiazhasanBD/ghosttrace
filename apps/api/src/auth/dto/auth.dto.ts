import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;

  @IsNotEmpty({ message: 'Name is required' })
  name!: string;

  @IsOptional()
  workspaceName?: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty({ message: 'Password is required' })
  password!: string;
}
