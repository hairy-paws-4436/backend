import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsEmail, 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  Matches, 
  MaxLength, 
  MinLength
} from 'class-validator';

export class CreateOngDto {
  
  @ApiProperty({
    description: 'NGO name',
    example: 'Happy Paws',
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name: string;

  @ApiProperty({
    description: 'NGO RUC (11 digits)',
    example: '20123456789',
  })
  @IsString({ message: 'RUC must be a string' })
  @IsNotEmpty({ message: 'RUC is required' })
  @Matches(/^20\d{9}$/, {
    message: 'RUC must start with 20 and have 11 digits in total (Peruvian format)',
  })
  ruc: string;

  @ApiProperty({
    description: 'NGO description',
    example: 'We are an organization dedicated to rescuing and adopting abandoned animals.',
  })
  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  @MinLength(20, { message: 'Description must be at least 20 characters long' })
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description: string;

  @ApiProperty({
    description: 'NGO address',
    example: '123 Main Ave, Miraflores, Lima',
  })
  @IsString({ message: 'Address must be a string' })
  @IsNotEmpty({ message: 'Address is required' })
  @MaxLength(255, { message: 'Address cannot exceed 255 characters' })
  address: string;

  @ApiProperty({
    description: 'Contact phone number (Peruvian format, 9 digits)',
    example: '987654321',
  })
  @IsString({ message: 'Phone number must be a string' })
  @IsNotEmpty({ message: 'Phone number is required' })
  @Matches(/^9\d{8}$/, {
    message: 'Phone number must start with 9 and have 9 digits in total (Peruvian format)',
  })
  phone: string;

  @ApiProperty({
    description: 'Contact email address',
    example: 'contact@happypaws.org',
  })
  @IsEmail({}, { message: 'Email format is not valid' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiPropertyOptional({
    description: 'NGO website',
    example: 'https://www.happypaws.org',
  })
  @IsString({ message: 'Website must be a string' })
  @IsOptional()
  @MaxLength(255, { message: 'Website cannot exceed 255 characters' })
  website?: string;

  @ApiPropertyOptional({
    description: 'NGO mission',
    example: 'Our mission is to promote responsible adoption and animal welfare.',
  })
  @IsString({ message: 'Mission must be a string' })
  @IsOptional()
  @MaxLength(500, { message: 'Mission cannot exceed 500 characters' })
  mission?: string;

  @ApiPropertyOptional({
    description: 'NGO vision',
    example: 'We aim to create a society where there are no abandoned animals.',
  })
  @IsString({ message: 'Vision must be a string' })
  @IsOptional()
  @MaxLength(500, { message: 'Vision cannot exceed 500 characters' })
  vision?: string;

  @ApiPropertyOptional({
    description: 'Bank account number',
    example: '191-123456789-0-01',
  })
  @IsString({ message: 'Bank account number must be a string' })
  @IsOptional()
  @MaxLength(20, { message: 'Bank account number cannot exceed 20 characters' })
  bankAccount?: string;

  @ApiPropertyOptional({
    description: 'Bank name',
    example: 'BCP',
  })
  @IsString({ message: 'Bank name must be a string' })
  @IsOptional()
  @MaxLength(100, { message: 'Bank name cannot exceed 100 characters' })
  bankName?: string;

  @ApiPropertyOptional({
    description: 'Interbank account number (CCI)',
    example: '00219100123456789001',
  })
  @IsString({ message: 'Interbank account number must be a string' })
  @IsOptional()
  @Matches(/^\d{20}$/, {
    message: 'Interbank account number must have 20 digits (Peruvian format)',
  })
  interbankAccount?: string;

  @ApiProperty({
    description: 'Receipt file (optional)',
    type: 'string',
    format: 'binary',
    required: false
  })
  @IsOptional()
  logo?: Express.Multer.File;

}
