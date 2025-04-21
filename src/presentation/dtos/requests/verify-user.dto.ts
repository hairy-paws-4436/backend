import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class VerifyUserDto {
  @ApiPropertyOptional({
    description: 'Verification notes (optional)',
    example: 'Verified after reviewing identity documents',
  })
  @IsString({ message: 'Notes must be a string' })
  @IsOptional()
  @MaxLength(500, { message: 'Notes cannot exceed 500 characters' })
  notes?: string;
}