import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class VerifyOngDto {
  @ApiPropertyOptional({
    description: 'Notas sobre la verificación (opcional)',
    example: 'ONG verificada después de revisar documentación legal',
  })
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  @IsOptional()
  @MaxLength(500, { message: 'Las notas no pueden exceder los 500 caracteres' })
  notes?: string;
}