import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ConfirmDonationDto {
  @ApiPropertyOptional({
    description: 'Notas adicionales sobre la confirmación',
    example: 'Recibidos todos los artículos en buen estado. Gracias por su donación.',
  })
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  @IsOptional()
  @MaxLength(500, { message: 'Las notas no pueden exceder los 500 caracteres' })
  notes?: string;
}