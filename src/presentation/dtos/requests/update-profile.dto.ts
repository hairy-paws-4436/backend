import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsOptional, 
  IsString, 
  Matches, 
  MaxLength, 
  MinLength 
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'User first name',
    example: 'Juan',
  })
  @IsString({ message: 'The first name must be a string' })
  @IsOptional()
  @MinLength(2, { message: 'The first name must have at least 2 characters' })
  @MaxLength(50, { message: 'The first name cannot exceed 50 characters' })
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Pérez',
  })
  @IsString({ message: 'The last name must be a string' })
  @IsOptional()
  @MinLength(2, { message: 'The last name must have at least 2 characters' })
  @MaxLength(50, { message: 'The last name cannot exceed 50 characters' })
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Phone number (Peruvian format, 9 digits)',
    example: '987654321',
  })
  @IsString({ message: 'The phone number must be a string' })
  @IsOptional()
  @Matches(/^9\d{8}$/, {
    message: 'The phone number must start with 9 and have 9 digits in total (Peruvian format)',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'User address',
    example: 'Av. Example 123, Lima',
  })
  @IsString({ message: 'The address must be a string' })
  @IsOptional()
  @MaxLength(255, { message: 'The address cannot exceed 255 characters' })
  address?: string;

  @ApiProperty({
    description: 'Image file (optional)',
    type: 'string',
    format: 'binary',
    required: false
  })
  @IsOptional()
  profileImage?: Express.Multer.File;

}
