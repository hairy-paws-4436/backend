import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MaxLength
} from 'class-validator';
import { Type } from 'class-transformer';
import { AnimalType } from '../../../core/domain/animal/value-objects/animal-type.enum';
import { AnimalGender } from '../../../core/domain/animal/value-objects/animal-gender.enum';
import {
  ExperienceLevel,
  HousingType,
  ActivityLevel,
  TimeAvailability,
  FamilyComposition
} from '../../../infrastructure/database/mysql/entities/user-preferences.entity';

export class CreateUserPreferencesDto {
  // Paso 1: Preferencias básicas de mascotas
  @ApiProperty({
    description: 'Tipos de animales preferidos',
    enum: AnimalType,
    isArray: true,
    example: [AnimalType.DOG, AnimalType.CAT],
  })
  @IsArray()
  @IsEnum(AnimalType, { each: true })
  preferredAnimalTypes: AnimalType[];

  @ApiPropertyOptional({
    description: 'Géneros preferidos',
    enum: AnimalGender,
    isArray: true,
    example: [AnimalGender.MALE],
  })
  @IsArray()
  @IsEnum(AnimalGender, { each: true })
  @IsOptional()
  preferredGenders?: AnimalGender[];

  @ApiPropertyOptional({
    description: 'Edad mínima preferida en años',
    example: 1,
    minimum: 0,
    maximum: 20,
  })
  @IsNumber()
  @Min(0)
  @Max(20)
  @Type(() => Number)
  @IsOptional()
  minAge?: number;

  @ApiPropertyOptional({
    description: 'Edad máxima preferida en años',
    example: 10,
    minimum: 0,
    maximum: 20,
  })
  @IsNumber()
  @Min(0)
  @Max(20)
  @Type(() => Number)
  @IsOptional()
  maxAge?: number;

  @ApiPropertyOptional({
    description: 'Peso mínimo preferido en kg',
    example: 5,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  minSize?: number;

  @ApiPropertyOptional({
    description: 'Peso máximo preferido en kg',
    example: 25,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  maxSize?: number;

  // Paso 2: Experiencia y conocimiento
  @ApiProperty({
    description: 'Nivel de experiencia con mascotas',
    enum: ExperienceLevel,
    example: ExperienceLevel.SOME_EXPERIENCE,
  })
  @IsEnum(ExperienceLevel)
  experienceLevel: ExperienceLevel;

  @ApiPropertyOptional({
    description: 'Experiencia previa con tipos específicos de animales',
    enum: AnimalType,
    isArray: true,
    example: [AnimalType.DOG],
  })
  @IsArray()
  @IsEnum(AnimalType, { each: true })
  @IsOptional()
  previousPetTypes?: AnimalType[];

  // Paso 3: Situación del hogar
  @ApiProperty({
    description: 'Tipo de vivienda',
    enum: HousingType,
    example: HousingType.HOUSE_SMALL_YARD,
  })
  @IsEnum(HousingType)
  housingType: HousingType;

  @ApiProperty({
    description: 'Composición familiar',
    enum: FamilyComposition,
    example: FamilyComposition.COUPLE,
  })
  @IsEnum(FamilyComposition)
  familyComposition: FamilyComposition;

  @ApiProperty({
    description: 'Tiene otras mascotas en casa',
    example: false,
  })
  @IsBoolean()
  @Type(() => Boolean)
  hasOtherPets: boolean;

  @ApiPropertyOptional({
    description: 'Descripción de otras mascotas que tiene',
    example: 'Un gato persa de 3 años, muy tranquilo',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  otherPetsDescription?: string;

  // Paso 4: Tiempo y actividad
  @ApiProperty({
    description: 'Tiempo disponible diario para la mascota',
    enum: TimeAvailability,
    example: TimeAvailability.MODERATE,
  })
  @IsEnum(TimeAvailability)
  timeAvailability: TimeAvailability;

  @ApiProperty({
    description: 'Nivel de actividad preferido',
    enum: ActivityLevel,
    example: ActivityLevel.MODERATE,
  })
  @IsEnum(ActivityLevel)
  preferredActivityLevel: ActivityLevel;

  @ApiPropertyOptional({
    description: 'Horario de trabajo',
    example: 'morning',
    enum: ['morning', 'afternoon', 'night', 'flexible', 'remote'],
  })
  @IsString()
  @IsOptional()
  workSchedule?: string;

  // Paso 5: Preferencias específicas
  @ApiProperty({
    description: 'Prefiere mascotas ya entrenadas',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  prefersTrained: boolean;

  @ApiProperty({
    description: 'Acepta mascotas con necesidades especiales',
    example: false,
  })
  @IsBoolean()
  @Type(() => Boolean)
  acceptsSpecialNeeds: boolean;

  @ApiProperty({
    description: 'Prefiere mascotas vacunadas',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  prefersVaccinated: boolean;

  @ApiProperty({
    description: 'Prefiere mascotas esterilizadas',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  prefersSterilized: boolean;

  // Paso 6: Ubicación y distancia
  @ApiProperty({
    description: 'Distancia máxima dispuesta a viajar en km',
    example: 30,
    minimum: 5,
    maximum: 500,
  })
  @IsNumber()
  @Min(5)
  @Max(500)
  @Type(() => Number)
  maxDistanceKm: number;

  @ApiPropertyOptional({
    description: 'Latitud de ubicación',
    example: -12.0464,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitud de ubicación',
    example: -77.0428,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  @IsOptional()
  longitude?: number;

  // Paso 7: Presupuesto y motivación
  @ApiPropertyOptional({
    description: 'Presupuesto mensual estimado para la mascota en soles',
    example: 300,
    minimum: 50,
    maximum: 2000,
  })
  @IsNumber()
  @Min(50)
  @Max(2000)
  @Type(() => Number)
  @IsOptional()
  monthlyBudget?: number;

  @ApiPropertyOptional({
    description: 'Razón principal para adoptar',
    example: 'Busco compañía y quiero dar una segunda oportunidad a una mascota',
    maxLength: 1000,
  })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  adoptionReason?: string;

  @ApiPropertyOptional({
    description: 'Descripción del estilo de vida',
    example: 'Trabajo desde casa, salgo a correr en las mañanas, weekends activos',
    maxLength: 1000,
  })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  lifestyleDescription?: string;
}