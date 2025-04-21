import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEventDto {

  @ApiProperty({
    description: 'Event title',
    example: 'Mass Adoption at Kennedy Park',
  })
  @IsString({ message: 'The title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(5, { message: 'Title must be at least 5 characters long' })
  @MaxLength(100, { message: 'Title cannot exceed 100 characters' })
  title: string;

  @ApiProperty({
    description: 'Event description',
    example: 'Adoption event where you can meet our rescues and give them a home.',
  })
  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  @MinLength(20, { message: 'Description must be at least 20 characters long' })
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description: string;

  @ApiProperty({
    description: 'Event date and time',
    example: '2023-12-15T14:00:00Z',
  })
  @IsNotEmpty({ message: 'Event date is required' })
  eventDate: Date;

  @ApiPropertyOptional({
    description: 'Event end date and time',
    example: '2023-12-15T18:00:00Z',
  })
  @IsOptional()
  endDate?: Date;

  @ApiProperty({
    description: 'Event location',
    example: 'Kennedy Park, Miraflores, Lima',
  })
  @IsString({ message: 'Location must be a string' })
  @IsNotEmpty({ message: 'Location is required' })
  @MaxLength(255, { message: 'Location cannot exceed 255 characters' })
  location: string;

  @ApiProperty({
    description: 'Is it a volunteer event?',
    example: true,
  })
  @IsBoolean({ message: 'It must be a boolean value' })
  @Type(() => Boolean)
  isVolunteerEvent: boolean;

  @ApiPropertyOptional({
    description: 'Maximum number of participants (for volunteer events)',
    example: 20,
  })
  @IsInt({ message: 'Maximum number of participants must be an integer' })
  @Min(1, { message: 'Maximum number of participants must be at least 1' })
  @IsOptional()
  @Type(() => Number)
  maxParticipants?: number;

  @ApiPropertyOptional({
    description: 'Requirements to participate in the event',
    example: 'Bring ID, be over 18',
  })
  @IsString({ message: 'Requirements must be a string' })
  @IsOptional()
  @MaxLength(500, { message: 'Requirements cannot exceed 500 characters' })
  requirements?: string;

  @ApiProperty({
    description: 'Receipt file (optional)',
    type: 'string',
    format: 'binary',
    required: false
  })
  @IsOptional()
  image: Express.Multer.File;

}
