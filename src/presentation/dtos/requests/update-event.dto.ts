import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateEventDto {
  @ApiPropertyOptional({
    description: 'Event title',
    example: 'Mass Adoption at Parque Kennedy',
  })
  @IsString({ message: 'The title must be a string' })
  @IsOptional()
  @MinLength(5, { message: 'The title must be at least 5 characters long' })
  @MaxLength(100, { message: 'The title cannot exceed 100 characters' })
  title?: string;

  @ApiPropertyOptional({
    description: 'Event description',
    example: 'Adoption event where you can meet our rescues and give them a home.',
  })
  @IsString({ message: 'The description must be a string' })
  @IsOptional()
  @MinLength(20, { message: 'The description must be at least 20 characters long' })
  @MaxLength(1000, { message: 'The description cannot exceed 1000 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Event date and time',
    example: '2023-12-15T14:00:00Z',
  })
  @IsOptional()
  eventDate?: Date;

  @ApiPropertyOptional({
    description: 'Event end date and time',
    example: '2023-12-15T18:00:00Z',
  })
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional({
    description: 'Event location',
    example: 'Parque Kennedy, Miraflores, Lima',
  })
  @IsString({ message: 'The location must be a string' })
  @IsOptional()
  @MaxLength(255, { message: 'The location cannot exceed 255 characters' })
  location?: string;

  @ApiPropertyOptional({
    description: 'Is it a volunteer event?',
    example: true,
  })
  @IsBoolean({ message: 'It must be a boolean value' })
  @IsOptional()
  @Type(() => Boolean)
  isVolunteerEvent?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum number of participants (for volunteer events)',
    example: 20,
  })
  @IsInt({ message: 'The maximum number of participants must be an integer' })
  @Min(1, { message: 'The maximum number of participants must be at least 1' })
  @IsOptional()
  @Type(() => Number)
  maxParticipants?: number;

  @ApiPropertyOptional({
    description: 'Requirements to participate in the event',
    example: 'Bring ID, be of legal age',
  })
  @IsString({ message: 'The requirements must be a string' })
  @IsOptional()
  @MaxLength(500, { message: 'The requirements cannot exceed 500 characters' })
  requirements?: string;

  @ApiPropertyOptional({
    description: 'Event active status',
    example: true,
  })
  @IsBoolean({ message: 'It must be a boolean value' })
  @IsOptional()
  @Type(() => Boolean)
  active?: boolean;

  @ApiProperty({
    description: 'Image (optional)',
    type: 'string',
    format: 'binary',
    required: false
  })
  @IsOptional()
  image?: Express.Multer.File;

}
