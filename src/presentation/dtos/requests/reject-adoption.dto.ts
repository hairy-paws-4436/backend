import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectAdoptionDto {
  @ApiProperty({
    description: 'Reason for rejection',
    example: 'Sorry, I have already accepted another adoption request for this pet.',
  })
  @IsString({ message: 'Reason must be a string' })
  @IsNotEmpty({ message: 'Reason is required' })
  @MaxLength(500, { message: 'Reason cannot exceed 500 characters' })
  reason: string;
}
