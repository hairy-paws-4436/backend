import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsEnum, 
  IsNotEmpty, 
  IsString, 
  IsNumber, 
  IsBoolean,
  IsOptional, 
  MinLength, 
  MaxLength,
  Min,
  Max
} from 'class-validator';
import { Type } from 'class-transformer';
import { AnimalGender } from 'src/core/domain/animal/value-objects/animal-gender.enum';
import { AnimalType } from 'src/core/domain/animal/value-objects/animal-type.enum';

export class CreateAnimalDto {
  @ApiProperty({
    description: 'Pet name',
    example: 'Rocky',
  })
  @IsString({ message: 'The name must be a string' })
  @IsNotEmpty({ message: 'The name is required' })
  @MinLength(2, { message: 'The name must be at least 2 characters long' })
  @MaxLength(50, { message: 'The name cannot exceed 50 characters' })
  name: string;

  @ApiProperty({
    description: 'Pet type',
    enum: AnimalType,
    example: AnimalType.DOG,
  })
  @IsEnum(AnimalType, { message: 'Invalid pet type' })
  @IsNotEmpty({ message: 'The pet type is required' })
  type: AnimalType;

  @ApiProperty({
    description: 'Pet breed',
    example: 'Labrador',
  })
  @IsString({ message: 'The breed must be a string' })
  @IsNotEmpty({ message: 'The breed is required' })
  @MaxLength(50, { message: 'The breed cannot exceed 50 characters' })
  breed: string;

  @ApiProperty({
    description: 'Pet age in years',
    example: 3,
  })
  @IsNumber({}, { message: 'The age must be a number' })
  @Type(() => Number)
  @Min(0, { message: 'The age cannot be negative' })
  @Max(100, { message: 'The age seems too high' })
  age: number;

  @ApiProperty({
    description: 'Pet gender',
    enum: AnimalGender,
    example: AnimalGender.MALE,
  })
  @IsEnum(AnimalGender, { message: 'Invalid pet gender' })
  @IsNotEmpty({ message: 'The pet gender is required' })
  gender: AnimalGender;

  @ApiProperty({
    description: 'Pet description',
    example: 'Friendly and playful Labrador, loves being around people and other dogs.',
  })
  @IsString({ message: 'The description must be a string' })
  @IsNotEmpty({ message: 'The description is required' })
  @MinLength(10, { message: 'The description must be at least 10 characters long' })
  @MaxLength(1000, { message: 'The description cannot exceed 1000 characters' })
  description: string;

  @ApiPropertyOptional({
    description: 'Pet weight in kg',
    example: 15.5,
  })
  @IsNumber({}, { message: 'The weight must be a number' })
  @Type(() => Number)
  @Min(0.1, { message: 'The weight must be greater than 0' })
  @Max(500, { message: 'The weight seems too high' })
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({
    description: 'Pet health details',
    example: 'Vaccines up to date, recently dewormed.',
  })
  @IsString({ message: 'Health details must be a string' })
  @IsOptional()
  @MaxLength(1000, { message: 'Health details cannot exceed 1000 characters' })
  healthDetails?: string;

  @ApiProperty({
    description: 'Indicates whether the pet is vaccinated',
    example: true,
  })
  @IsBoolean({ message: 'The vaccinated field must be a boolean value' })
  @Type(() => Boolean)
  vaccinated: boolean;

  @ApiProperty({
    description: 'Indicates whether the pet is sterilized',
    example: true,
  })
  @IsBoolean({ message: 'The sterilized field must be a boolean value' })
  @Type(() => Boolean)
  sterilized: boolean;

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