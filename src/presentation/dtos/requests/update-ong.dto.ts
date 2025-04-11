import { ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsEmail, 
  IsOptional, 
  IsString, 
  Matches, 
  MaxLength, 
  MinLength
} from 'class-validator';

export class UpdateOngDto {
  @ApiPropertyOptional({
    description: 'Nombre de la ONG',
    example: 'Patitas Felices',
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsOptional()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder los 100 caracteres' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Descripción de la ONG',
    example: 'Somos una organización dedicada al rescate y adopción de animales abandonados.',
  })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsOptional()
  @MinLength(20, { message: 'La descripción debe tener al menos 20 caracteres' })
  @MaxLength(1000, { message: 'La descripción no puede exceder los 1000 caracteres' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Dirección de la ONG',
    example: 'Av. Principal 123, Miraflores, Lima',
  })
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @IsOptional()
  @MaxLength(255, { message: 'La dirección no puede exceder los 255 caracteres' })
  address?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto (formato peruano, 9 dígitos)',
    example: '987654321',
  })
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @IsOptional()
  @Matches(/^9\d{8}$/, {
    message: 'El teléfono debe comenzar con 9 y tener 9 dígitos en total (formato peruano)',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico de contacto',
    example: 'contacto@patitasfelices.org',
  })
  @IsEmail({}, { message: 'El formato del correo electrónico no es válido' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Sitio web de la ONG',
    example: 'https://www.patitasfelices.org',
  })
  @IsString({ message: 'El sitio web debe ser una cadena de texto' })
  @IsOptional()
  @MaxLength(255, { message: 'El sitio web no puede exceder los 255 caracteres' })
  website?: string;

  @ApiPropertyOptional({
    description: 'Misión de la ONG',
    example: 'Nuestra misión es promover la adopción responsable y el bienestar animal.',
  })
  @IsString({ message: 'La misión debe ser una cadena de texto' })
  @IsOptional()
  @MaxLength(500, { message: 'La misión no puede exceder los 500 caracteres' })
  mission?: string;

  @ApiPropertyOptional({
    description: 'Visión de la ONG',
    example: 'Buscamos crear una sociedad donde no existan animales abandonados.',
  })
  @IsString({ message: 'La visión debe ser una cadena de texto' })
  @IsOptional()
  @MaxLength(500, { message: 'La visión no puede exceder los 500 caracteres' })
  vision?: string;

  @ApiPropertyOptional({
    description: 'Número de cuenta bancaria',
    example: '191-123456789-0-01',
  })
  @IsString({ message: 'El número de cuenta debe ser una cadena de texto' })
  @IsOptional()
  @MaxLength(20, { message: 'El número de cuenta no puede exceder los 20 caracteres' })
  bankAccount?: string;

  @ApiPropertyOptional({
    description: 'Nombre del banco',
    example: 'BCP',
  })
  @IsString({ message: 'El nombre del banco debe ser una cadena de texto' })
  @IsOptional()
  @MaxLength(100, { message: 'El nombre del banco no puede exceder los 100 caracteres' })
  bankName?: string;

  @ApiPropertyOptional({
    description: 'Número de cuenta interbancaria (CCI)',
    example: '00219100123456789001',
  })
  @IsString({ message: 'El número de cuenta interbancaria debe ser una cadena de texto' })
  @IsOptional()
  @Matches(/^\d{20}$/, {
    message: 'El número de cuenta interbancaria debe tener 20 dígitos (formato peruano)',
  })
  interbankAccount?: string;

  // logo es manejado por el FileInterceptor
}