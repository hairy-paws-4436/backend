import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class VerifyOngDto {
  @ApiPropertyOptional({
    description: 'Verification notes (optional)',
    example: 'NGO verified after reviewing legal documentation',
  })
  @IsString({ message: 'Notes must be a string' })
  @IsOptional()
  @MaxLength(500, { message: 'Notes cannot exceed 500 characters' })
  notes?: string;
}