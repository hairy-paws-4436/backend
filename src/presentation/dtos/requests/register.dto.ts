import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../../core/domain/user/value-objects/user-role.enum';


export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email format is not valid' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description:
      'User password (minimum 8 characters, must contain at least one uppercase letter, one lowercase letter, and one number)',
    example: 'Password123!',
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number or special character',
  })
  password: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name cannot exceed 50 characters' })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name cannot exceed 50 characters' })
  lastName: string;

  @ApiProperty({
    description: 'Phone number (Peruvian format, 9 digits starting with 9)',
    example: '987654321',
  })
  @IsString({ message: 'Phone number must be a string' })
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^9\d{8}$/, {
    message:
      'Phone number must start with 9 and have 9 digits in total (Peruvian format)',
  })
  phoneNumber: string;

  @ApiProperty({
    description: 'Identification document (Peruvian DNI - 8 digits)',
    example: '12345678',
  })
  @IsString({ message: 'The identification document must be a text string' })
  @IsNotEmpty({ message: 'The identification document is required' })
  @Matches(/^\d{8}$/, {
    message:
      'The identification document must have 8 digits (Peruvian DNI format)',
  })
  identityDocument: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: UserRole,
    default: UserRole.ADOPTER,
  })
  @IsEnum(UserRole, { message: 'Invalid role' })
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'User address',
    example: '123 Example Ave, Lima',
  })
  @IsString({ message: 'Address must be a string' })
  @IsOptional()
  @MaxLength(255, { message: 'Address cannot exceed 255 characters' })
  address?: string;
}
