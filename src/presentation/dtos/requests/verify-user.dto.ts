import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class VerifyUserDto {
  @ApiPropertyOptional({
    description: 'Notas sobre la verificación (opcional)',
    example: 'Verificado después de revisar documentos de identidad',
  })
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  @IsOptional()
  @MaxLength(500, { message: 'Las notas no pueden exceder los 500 caracteres' })
  notes?: string;
}