import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsEnum, 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  MaxLength, 
  IsDateString,
  IsUUID,
  ValidateIf
} from 'class-validator';
import { AdoptionType } from 'src/core/domain/adoption/value-objects/adoption-type.enum';


export class RequestAdoptionDto {
  @ApiProperty({
    description: 'ID de la mascota a adoptar',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID('4', { message: 'El ID de la mascota no es válido' })
  @IsNotEmpty({ message: 'El ID de la mascota es requerido' })
  animalId: string;

  @ApiProperty({
    description: 'Tipo de solicitud',
    enum: AdoptionType,
    example: AdoptionType.ADOPTION,
  })
  @IsEnum(AdoptionType, { message: 'Tipo de solicitud no válido' })
  @IsNotEmpty({ message: 'El tipo de solicitud es requerido' })
  type: AdoptionType;

  @ApiProperty({
    description: 'Fecha de visita (requerida solo para solicitudes de tipo visita)',
    example: '2023-05-20T10:00:00Z',
  })
  @ValidateIf(o => o.type === AdoptionType.VISIT)
  @IsDateString({}, { message: 'La fecha de visita debe ser una fecha válida' })
  @IsNotEmpty({ message: 'La fecha de visita es requerida para solicitudes de tipo visita' })
  visitDate?: Date;

  @ApiPropertyOptional({
    description: 'Notas o comentarios adicionales',
    example: 'Me gustaría adoptar esta mascota porque tengo experiencia con esta raza.',
  })
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  @IsOptional()
  @MaxLength(500, { message: 'Las notas no pueden exceder los 500 caracteres' })
  notes?: string;
}