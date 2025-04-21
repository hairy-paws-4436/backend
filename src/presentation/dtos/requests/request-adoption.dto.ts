import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsEnum, 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  MaxLength, 
  IsUUID,
  ValidateIf
} from 'class-validator';
import { AdoptionType } from 'src/core/domain/adoption/value-objects/adoption-type.enum';

export class RequestAdoptionDto {
  @ApiProperty({
    description: 'ID of the pet to adopt',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID('4', { message: 'Pet ID is not valid' })
  @IsNotEmpty({ message: 'Pet ID is required' })
  animalId: string;

  @ApiProperty({
    description: 'Type of request',
    enum: AdoptionType,
    example: AdoptionType.ADOPTION,
  })
  @IsEnum(AdoptionType, { message: 'Invalid request type' })
  @IsNotEmpty({ message: 'Request type is required' })
  type: AdoptionType;

  @ApiProperty({
    description: 'Visit date (required only for visit requests)',
    example: '2023-05-20T10:00:00Z',
  })
  @ValidateIf(o => o.type === AdoptionType.VISIT)
  @IsNotEmpty({ message: 'Visit date is required for visit requests' })
  visitDate?: Date;

  @ApiPropertyOptional({
    description: 'Additional notes or comments',
    example: 'I would like to adopt this pet because I have experience with this breed.',
  })
  @IsString({ message: 'Notes must be a string' })
  @IsOptional()
  @MaxLength(500, { message: 'Notes cannot exceed 500 characters' })
  notes?: string;
}
