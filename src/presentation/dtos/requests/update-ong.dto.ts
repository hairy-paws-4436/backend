import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsEmail, 
  IsOptional, 
  IsString, 
  Matches, 
  MaxLength, 
  MinLength
} from 'class-validator';

export class UpdateOngDto {
  @ApiPropertyOptional({
    description: 'NGO name',
    example: 'Happy Paws',
  })
  @IsString({ message: 'The name must be a string' })
  @IsOptional()
  @MinLength(3, { message: 'The name must be at least 3 characters long' })
  @MaxLength(100, { message: 'The name cannot exceed 100 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'NGO description',
    example: 'We are an organization dedicated to rescuing and adopting abandoned animals.',
  })
  @IsString({ message: 'The description must be a string' })
  @IsOptional()
  @MinLength(20, { message: 'The description must be at least 20 characters long' })
  @MaxLength(1000, { message: 'The description cannot exceed 1000 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'NGO address',
    example: '123 Main Ave, Miraflores, Lima',
  })
  @IsString({ message: 'The address must be a string' })
  @IsOptional()
  @MaxLength(255, { message: 'The address cannot exceed 255 characters' })
  address?: string;

  @ApiPropertyOptional({
    description: 'Contact phone (Peruvian format, 9 digits)',
    example: '987654321',
  })
  @IsString({ message: 'The phone number must be a string' })
  @IsOptional()
  @Matches(/^9\d{8}$/, {
    message: 'The phone number must start with 9 and have 9 digits in total (Peruvian format)',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Contact email',
    example: 'contact@happypaws.org',
  })
  @IsEmail({}, { message: 'The email format is invalid' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'NGO website',
    example: 'https://www.happypaws.org',
  })
  @IsString({ message: 'The website must be a string' })
  @IsOptional()
  @MaxLength(255, { message: 'The website cannot exceed 255 characters' })
  website?: string;

  @ApiPropertyOptional({
    description: 'NGO mission',
    example: 'Our mission is to promote responsible adoption and animal welfare.',
  })
  @IsString({ message: 'The mission must be a string' })
  @IsOptional()
  @MaxLength(500, { message: 'The mission cannot exceed 500 characters' })
  mission?: string;

  @ApiPropertyOptional({
    description: 'NGO vision',
    example: 'We aim to create a society where no animals are abandoned.',
  })
  @IsString({ message: 'The vision must be a string' })
  @IsOptional()
  @MaxLength(500, { message: 'The vision cannot exceed 500 characters' })
  vision?: string;

  @ApiPropertyOptional({
    description: 'Bank account number',
    example: '191-123456789-0-01',
  })
  @IsString({ message: 'The account number must be a string' })
  @IsOptional()
  @MaxLength(20, { message: 'The account number cannot exceed 20 characters' })
  bankAccount?: string;

  @ApiPropertyOptional({
    description: 'Bank name',
    example: 'BCP',
  })
  @IsString({ message: 'The bank name must be a string' })
  @IsOptional()
  @MaxLength(100, { message: 'The bank name cannot exceed 100 characters' })
  bankName?: string;

  @ApiPropertyOptional({
    description: 'Interbank account number (CCI)',
    example: '00219100123456789001',
  })
  @IsString({ message: 'The interbank account number must be a string' })
  @IsOptional()
  @Matches(/^\d{20}$/, {
    message: 'The interbank account number must have 20 digits (Peruvian format)',
  })
  interbankAccount?: string;

  @ApiProperty({
    description: 'Logo (optional)',
    type: 'string',
    format: 'binary',
    required: false
  })
  @IsOptional()
  logo?: Express.Multer.File;

}
