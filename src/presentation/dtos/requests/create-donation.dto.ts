import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { DonationType } from 'src/core/domain/donation/value-objects/donation-type.enum';

class DonationItemDto {
  @ApiProperty({
    description: 'Item name',
    example: 'Dog food',
  })
  @IsString({ message: 'The name must be a string' })
  @IsNotEmpty({ message: 'The name is required' })
  @MaxLength(100, { message: 'The name cannot exceed 100 characters' })
  name: string;

  @ApiProperty({
    description: 'Item quantity',
    example: 5,
  })
  @IsInt({ message: 'The quantity must be an integer' })
  @IsPositive({ message: 'The quantity must be greater than 0' })
  @Type(() => Number)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Item detailed description',
    example: 'Adult dog food, 3kg',
  })
  @IsString({ message: 'The description must be a string' })
  @IsOptional()
  @MaxLength(255, { message: 'The description cannot exceed 255 characters' })
  description?: string;
}

export class CreateDonationDto {
  @ApiProperty({
    description: 'ID of the NGO receiving the donation',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID('4', { message: 'The NGO ID is not valid' })
  @IsNotEmpty({ message: 'The NGO ID is required' })
  ongId: string;
  
  @ApiProperty({
    description: 'Donor ID (automatically assigned)',
  })
  @IsOptional()
  donorId?: string;

  @ApiProperty({
    description: 'Donation type',
    enum: DonationType,
    example: DonationType.MONEY,
  })
  @IsEnum(DonationType, { message: 'Invalid donation type' })
  @IsNotEmpty({ message: 'The donation type is required' })
  type: DonationType;

  @ApiProperty({
    description: 'Donation amount (required for money donations)',
    example: 100.50,
  })
  @ValidateIf(o => o.type === DonationType.MONEY || o.type === DonationType.BOTH)
  @IsNumber({}, { message: 'The amount must be a number' })
  @IsPositive({ message: 'The amount must be greater than 0' })
  @Type(() => Number)
  amount?: number;

  @ApiPropertyOptional({
    description: 'Transaction ID (for money donations)',
    example: 'TRX123456789',
  })
  @IsString({ message: 'The transaction ID must be a string' })
  @IsOptional()
  @MaxLength(100, { message: 'The transaction ID cannot exceed 100 characters' })
  transactionId?: string;

  @ApiPropertyOptional({
    description: 'Additional notes about the donation',
    example: 'Donation for the vaccination campaign',
  })
  @IsString({ message: 'The notes must be a string' })
  @IsOptional()
  @MaxLength(500, { message: 'The notes cannot exceed 500 characters' })
  notes?: string;

  @ApiProperty({
    description: 'Donated items (required for item donations)',
    type: [DonationItemDto],
  })
  @ValidateIf(o => o.type === DonationType.ITEMS || o.type === DonationType.BOTH)
  @IsArray({ message: 'The items must be an array' })
  @ValidateNested({ each: true })
  @Type(() => DonationItemDto)
  items?: DonationItemDto[];

  @ApiProperty({
    description: 'Receipt file (optional)',
    type: 'string',
    format: 'binary',
    required: false
  })

  receipt: Express.Multer.File;
}
