import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ConfirmDonationDto {
  @ApiPropertyOptional({
    description: 'Additional notes about the confirmation',
    example: 'All items received in good condition. Thank you for your donation.',
  })
  @IsString({ message: 'The notes must be a string' })
  @IsOptional()
  @MaxLength(500, { message: 'The notes cannot exceed 500 characters' })
  notes?: string;
}
