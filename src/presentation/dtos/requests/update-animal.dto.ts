import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsBoolean, 
  IsEnum, 
  IsNumber, 
  IsOptional, 
  IsString, 
  MaxLength, 
  Min, 
  MinLength 
} from 'class-validator';
import { Type } from 'class-transformer';
import { AnimalGender } from 'src/core/domain/animal/value-objects/animal-gender.enum';
import { AnimalType } from 'src/core/domain/animal/value-objects/animal-type.enum';

export class UpdateAnimalDto {
  @ApiPropertyOptional({
    description: 'Pet name',
    example: 'Rocky',
  })
  @IsString({ message: 'The name must be a string' })
  @IsOptional()
  @MinLength(2, { message: 'The name must be at least 2 characters' })
  @MaxLength(50, { message: 'The name cannot exceed 50 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Pet type',
    enum: AnimalType,
    example: AnimalType.DOG,
  })
  @IsEnum(AnimalType, { message: 'Invalid pet type' })
  @IsOptional()
  type?: AnimalType;

  @ApiPropertyOptional({
    description: 'Pet breed',
    example: 'Labrador',
  })
  @IsString({ message: 'The breed must be a string' })
  @IsOptional()
  @MaxLength(50, { message: 'The breed cannot exceed 50 characters' })
  breed?: string;

  @ApiPropertyOptional({
    description: 'Pet age in years',
    example: 3,
  })
  @IsNumber({}, { message: 'The age must be a number' })
  @IsOptional()
  @Type(() => Number)
  @Min(0, { message: 'The age cannot be negative' })
  age?: number;

  @ApiPropertyOptional({
    description: 'Pet gender',
    enum: AnimalGender,
    example: AnimalGender.MALE,
  })
  @IsEnum(AnimalGender, { message: 'Invalid pet gender' })
  @IsOptional()
  gender?: AnimalGender;

  @ApiPropertyOptional({
    description: 'Pet description',
    example: 'Friendly and playful Labrador, loves being with people and other dogs.',
  })
  @IsString({ message: 'The description must be a string' })
  @IsOptional()
  @MinLength(10, { message: 'The description must be at least 10 characters' })
  @MaxLength(1000, { message: 'The description cannot exceed 1000 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Pet weight in kg',
    example: 15.5,
  })
  @IsNumber({}, { message: 'The weight must be a number' })
  @IsOptional()
  @Type(() => Number)
  @Min(0.1, { message: 'The weight must be greater than 0' })
  weight?: number;

  @ApiPropertyOptional({
    description: 'Pet health details',
    example: 'Vaccines up to date, recently dewormed.',
  })
  @IsString({ message: 'Health details must be a string' })
  @IsOptional()
  @MaxLength(1000, { message: 'Health details cannot exceed 1000 characters' })
  healthDetails?: string;

  @ApiPropertyOptional({
    description: 'Indicates whether the pet is vaccinated',
    example: true,
  })
  @IsBoolean({ message: 'The vaccinated field must be a boolean value' })
  @IsOptional()
  @Type(() => Boolean)
  vaccinated?: boolean;

  @ApiPropertyOptional({
    description: 'Indicates whether the pet is sterilized',
    example: true,
  })
  @IsBoolean({ message: 'The sterilized field must be a boolean value' })
  @IsOptional()
  @Type(() => Boolean)
  sterilized?: boolean;

  @ApiPropertyOptional({
    description: 'Indicates whether the pet is available for adoption',
    example: true,
  })
  @IsBoolean({ message: 'The availability field must be a boolean value' })
  @IsOptional()
  @Type(() => Boolean)
  availableForAdoption?: boolean;
  
  @ApiProperty({
    description: 'Pet images (maximum 5)',
    type: 'array',
    items: {
      type: 'string',
      format: 'binary'
    },
    required: false
  })
  @IsOptional()
  images?: any[];
}
