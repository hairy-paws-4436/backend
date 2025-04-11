import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApproveAdoptionDto {
  @ApiPropertyOptional({
    description: 'Notas adicionales para la aprobación',
    example: 'Puedes venir a recoger a la mascota el sábado por la mañana.',
  })
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  @IsOptional()
  @MaxLength(500, { message: 'Las notas no pueden exceder los 500 caracteres' })
  notes?: string;
}