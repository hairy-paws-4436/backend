import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectAdoptionDto {
  @ApiProperty({
    description: 'Motivo del rechazo',
    example: 'Lo siento, ya he aceptado otra solicitud de adopción para esta mascota.',
  })
  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El motivo es requerido' })
  @MaxLength(500, { message: 'El motivo no puede exceder los 500 caracteres' })
  reason: string;
}