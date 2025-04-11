import { ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsOptional, 
  IsString, 
  Matches, 
  MaxLength, 
  MinLength 
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Nombre del usuario',
    example: 'Juan',
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsOptional()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede exceder los 50 caracteres' })
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Apellido del usuario',
    example: 'Pérez',
  })
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  @IsOptional()
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El apellido no puede exceder los 50 caracteres' })
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono (formato peruano, 9 dígitos)',
    example: '987654321',
  })
  @IsString({ message: 'El número de teléfono debe ser una cadena de texto' })
  @IsOptional()
  @Matches(/^9\d{8}$/, {
    message: 'El número telefónico debe comenzar con 9 y tener 9 dígitos en total (formato peruano)',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Dirección del usuario',
    example: 'Av. Example 123, Lima',
  })
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @IsOptional()
  @MaxLength(255, { message: 'La dirección no puede exceder los 255 caracteres' })
  address?: string;

  // profileImage es manejado por el FileInterceptor
}