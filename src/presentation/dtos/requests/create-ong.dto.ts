import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsEmail, 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  Matches, 
  MaxLength, 
  MinLength
} from 'class-validator';

export class CreateOngDto {
  
  @ApiProperty({
    description: 'Nombre de la ONG',
    example: 'Patitas Felices',
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder los 100 caracteres' })
  name: string;

  @ApiProperty({
    description: 'RUC de la ONG (11 dígitos)',
    example: '20123456789',
  })
  @IsString({ message: 'El RUC debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El RUC es requerido' })
  @Matches(/^20\d{9}$/, {
    message: 'El RUC debe comenzar con 20 y tener 11 dígitos en total (formato peruano)',
  })
  ruc: string;

  @ApiProperty({
    description: 'Descripción de la ONG',
    example: 'Somos una organización dedicada al rescate y adopción de animales abandonados.',
  })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La descripción es requerida' })
  @MinLength(20, { message: 'La descripción debe tener al menos 20 caracteres' })
  @MaxLength(1000, { message: 'La descripción no puede exceder los 1000 caracteres' })
  description: string;

  @ApiProperty({
    description: 'Dirección de la ONG',
    example: 'Av. Principal 123, Miraflores, Lima',
  })
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La dirección es requerida' })
  @MaxLength(255, { message: 'La dirección no puede exceder los 255 caracteres' })
  address: string;

  @ApiProperty({
    description: 'Teléfono de contacto (formato peruano, 9 dígitos)',
    example: '987654321',
  })
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El teléfono es requerido' })
  @Matches(/^9\d{8}$/, {
    message: 'El teléfono debe comenzar con 9 y tener 9 dígitos en total (formato peruano)',
  })
  phone: string;

  @ApiProperty({
    description: 'Correo electrónico de contacto',
    example: 'contacto@patitasfelices.org',
  })
  @IsEmail({}, { message: 'El formato del correo electrónico no es válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email: string;

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


  @ApiProperty({
    description: 'Archivo de recibo (opcional)',
    type: 'string',
    format: 'binary',
    required: false
  })
  @IsOptional()
  logo?: Express.Multer.File;

  // logo es manejado por el FileInterceptor
}