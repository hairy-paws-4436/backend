import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsBoolean, 
  IsEnum, 
  IsNumber, 
  IsOptional, 
  IsString, 
  MaxLength, 
  Min, 
  MinLength
} from 'class-validator';
import { Type } from 'class-transformer';
import { AnimalGender } from 'src/core/domain/animal/value-objects/animal-gender.enum';
import { AnimalType } from 'src/core/domain/animal/value-objects/animal-type.enum';


export class UpdateAnimalDto {
  @ApiPropertyOptional({
    description: 'Nombre de la mascota',
    example: 'Rocky',
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsOptional()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede exceder los 50 caracteres' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Tipo de mascota',
    enum: AnimalType,
    example: AnimalType.DOG,
  })
  @IsEnum(AnimalType, { message: 'Tipo de mascota no válido' })
  @IsOptional()
  type?: AnimalType;

  @ApiPropertyOptional({
    description: 'Raza de la mascota',
    example: 'Labrador',
  })
  @IsString({ message: 'La raza debe ser una cadena de texto' })
  @IsOptional()
  @MaxLength(50, { message: 'La raza no puede exceder los 50 caracteres' })
  breed?: string;

  @ApiPropertyOptional({
    description: 'Edad de la mascota en años',
    example: 3,
  })
  @IsNumber({}, { message: 'La edad debe ser un número' })
  @IsOptional()
  @Type(() => Number)
  @Min(0, { message: 'La edad no puede ser negativa' })
  age?: number;

  @ApiPropertyOptional({
    description: 'Género de la mascota',
    enum: AnimalGender,
    example: AnimalGender.MALE,
  })
  @IsEnum(AnimalGender, { message: 'Género de mascota no válido' })
  @IsOptional()
  gender?: AnimalGender;

  @ApiPropertyOptional({
    description: 'Descripción de la mascota',
    example: 'Labrador amigable y juguetón, le encanta estar con personas y otros perros.',
  })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsOptional()
  @MinLength(10, { message: 'La descripción debe tener al menos 10 caracteres' })
  @MaxLength(1000, { message: 'La descripción no puede exceder los 1000 caracteres' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Peso de la mascota en kg',
    example: 15.5,
  })
  @IsNumber({}, { message: 'El peso debe ser un número' })
  @IsOptional()
  @Type(() => Number)
  @Min(0.1, { message: 'El peso debe ser mayor que 0' })
  weight?: number;

  @ApiPropertyOptional({
    description: 'Detalles de salud de la mascota',
    example: 'Vacunas al día, desparasitado recientemente.',
  })
  @IsString({ message: 'Los detalles de salud deben ser una cadena de texto' })
  @IsOptional()
  @MaxLength(1000, { message: 'Los detalles de salud no pueden exceder los 1000 caracteres' })
  healthDetails?: string;

  @ApiPropertyOptional({
    description: 'Indica si la mascota está vacunada',
    example: true,
  })
  @IsBoolean({ message: 'El campo vacunado debe ser un valor booleano' })
  @IsOptional()
  @Type(() => Boolean)
  vaccinated?: boolean;

  @ApiPropertyOptional({
    description: 'Indica si la mascota está esterilizada',
    example: true,
  })
  @IsBoolean({ message: 'El campo esterilizado debe ser un valor booleano' })
  @IsOptional()
  @Type(() => Boolean)
  sterilized?: boolean;

  @ApiPropertyOptional({
    description: 'Indica si la mascota está disponible para adopción',
    example: true,
  })
  @IsBoolean({ message: 'El campo de disponibilidad debe ser un valor booleano' })
  @IsOptional()
  @Type(() => Boolean)
  availableForAdoption?: boolean;
  
  @ApiProperty({
      description: 'Imágenes de la mascota (máximo 5)',
      type: 'array',
      items: {
        type: 'string',
        format: 'binary'
      },
      required: false
    })
  @IsOptional()
  images?: any[];
}