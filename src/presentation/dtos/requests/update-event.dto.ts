import { ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateEventDto {
  @ApiPropertyOptional({
    description: 'Título del evento',
    example: 'Adopción Masiva en el Parque Kennedy',
  })
  @IsString({ message: 'El título debe ser una cadena de texto' })
  @IsOptional()
  @MinLength(5, { message: 'El título debe tener al menos 5 caracteres' })
  @MaxLength(100, { message: 'El título no puede exceder los 100 caracteres' })
  title?: string;

  @ApiPropertyOptional({
    description: 'Descripción del evento',
    example: 'Evento de adopción donde podrás conocer a nuestros rescatados y darles un hogar.',
  })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsOptional()
  @MinLength(20, { message: 'La descripción debe tener al menos 20 caracteres' })
  @MaxLength(1000, { message: 'La descripción no puede exceder los 1000 caracteres' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Fecha y hora del evento',
    example: '2023-12-15T14:00:00Z',
  })
  @IsDateString({}, { message: 'La fecha del evento debe ser una fecha válida' })
  @IsOptional()
  eventDate?: Date;

  @ApiPropertyOptional({
    description: 'Fecha y hora de finalización del evento',
    example: '2023-12-15T18:00:00Z',
  })
  @IsDateString({}, { message: 'La fecha de finalización debe ser una fecha válida' })
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional({
    description: 'Ubicación del evento',
    example: 'Parque Kennedy, Miraflores, Lima',
  })
  @IsString({ message: 'La ubicación debe ser una cadena de texto' })
  @IsOptional()
  @MaxLength(255, { message: 'La ubicación no puede exceder los 255 caracteres' })
  location?: string;

  @ApiPropertyOptional({
    description: '¿Es un evento de voluntariado?',
    example: true,
  })
  @IsBoolean({ message: 'Debe ser un valor booleano' })
  @IsOptional()
  @Type(() => Boolean)
  isVolunteerEvent?: boolean;

  @ApiPropertyOptional({
    description: 'Número máximo de participantes (para eventos de voluntariado)',
    example: 20,
  })
  @IsInt({ message: 'El número máximo de participantes debe ser un número entero' })
  @Min(1, { message: 'El número máximo de participantes debe ser al menos 1' })
  @IsOptional()
  @Type(() => Number)
  maxParticipants?: number;

  @ApiPropertyOptional({
    description: 'Requisitos para participar en el evento',
    example: 'Traer DNI, ser mayor de edad',
  })
  @IsString({ message: 'Los requisitos deben ser una cadena de texto' })
  @IsOptional()
  @MaxLength(500, { message: 'Los requisitos no pueden exceder los 500 caracteres' })
  requirements?: string;

  @ApiPropertyOptional({
    description: 'Estado activo del evento',
    example: true,
  })
  @IsBoolean({ message: 'Debe ser un valor booleano' })
  @IsOptional()
  @Type(() => Boolean)
  active?: boolean;

  // image es manejado por el FileInterceptor
}