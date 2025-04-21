import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApproveAdoptionDto {
  @ApiPropertyOptional({
    description: 'Additional notes for approval',
    example: 'You can come to pick up the pet on Saturday morning.',
  })
  @IsString({ message: 'Notes must be a string' })
  @IsOptional()
  @MaxLength(500, { message: 'Notes cannot exceed 500 characters' })
  notes?: string;
}