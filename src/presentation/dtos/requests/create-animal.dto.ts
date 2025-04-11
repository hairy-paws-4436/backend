import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsEnum, 
  IsNotEmpty, 
  IsString, 
  IsNumber, 
  IsBoolean,
  IsOptional, 
  MinLength, 
  MaxLength,
  Min,
  Max
} from 'class-validator';
import { Type } from 'class-transformer';
import { AnimalGender } from 'src/core/domain/animal/value-objects/animal-gender.enum';
import { AnimalType } from 'src/core/domain/animal/value-objects/animal-type.enum';


export class CreateAnimalDto {
  @ApiProperty({
    description: 'Nombre de la mascota',
    example: 'Rocky',
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede exceder los 50 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Tipo de mascota',
    enum: AnimalType,
    example: AnimalType.DOG,
  })
  @IsEnum(AnimalType, { message: 'Tipo de mascota no válido' })
  @IsNotEmpty({ message: 'El tipo de mascota es requerido' })
  type: AnimalType;

  @ApiProperty({
    description: 'Raza de la mascota',
    example: 'Labrador',
  })
  @IsString({ message: 'La raza debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La raza es requerida' })
  @MaxLength(50, { message: 'La raza no puede exceder los 50 caracteres' })
  breed: string;

  @ApiProperty({
    description: 'Edad de la mascota en años',
    example: 3,
  })
  @IsNumber({}, { message: 'La edad debe ser un número' })
  @Type(() => Number)
  @Min(0, { message: 'La edad no puede ser negativa' })
  @Max(100, { message: 'La edad parece ser demasiado alta' })
  age: number;

  @ApiProperty({
    description: 'Género de la mascota',
    enum: AnimalGender,
    example: AnimalGender.MALE,
  })
  @IsEnum(AnimalGender, { message: 'Género de mascota no válido' })
  @IsNotEmpty({ message: 'El género de la mascota es requerido' })
  gender: AnimalGender;

  @ApiProperty({
    description: 'Descripción de la mascota',
    example: 'Labrador amigable y juguetón, le encanta estar con personas y otros perros.',
  })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La descripción es requerida' })
  @MinLength(10, { message: 'La descripción debe tener al menos 10 caracteres' })
  @MaxLength(1000, { message: 'La descripción no puede exceder los 1000 caracteres' })
  description: string;

  @ApiPropertyOptional({
    description: 'Peso de la mascota en kg',
    example: 15.5,
  })
  @IsNumber({}, { message: 'El peso debe ser un número' })
  @Type(() => Number)
  @Min(0.1, { message: 'El peso debe ser mayor que 0' })
  @Max(500, { message: 'El peso parece ser demasiado alto' })
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({
    description: 'Detalles de salud de la mascota',
    example: 'Vacunas al día, desparasitado recientemente.',
  })
  @IsString({ message: 'Los detalles de salud deben ser una cadena de texto' })
  @IsOptional()
  @MaxLength(1000, { message: 'Los detalles de salud no pueden exceder los 1000 caracteres' })
  healthDetails?: string;

  @ApiProperty({
    description: 'Indica si la mascota está vacunada',
    example: true,
  })
  @IsBoolean({ message: 'El campo vacunado debe ser un valor booleano' })
  @Type(() => Boolean)
  vaccinated: boolean;

  @ApiProperty({
    description: 'Indica si la mascota está esterilizada',
    example: true,
  })
  @IsBoolean({ message: 'El campo esterilizado debe ser un valor booleano' })
  @Type(() => Boolean)
  sterilized: boolean;
}