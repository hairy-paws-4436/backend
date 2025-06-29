import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  EnergyLevel,
  SocialLevel,
  TrainingLevel,
  CareLevel
} from '../../../infrastructure/database/mysql/entities/animal-profile.entity';

export class CreateAnimalProfileDto {
  // Personalidad y comportamiento
  @ApiProperty({
    description: 'Nivel de energía del animal',
    enum: EnergyLevel,
    example: EnergyLevel.MODERATE,
  })
  @IsEnum(EnergyLevel)
  energyLevel: EnergyLevel;

  @ApiProperty({
    description: 'Nivel de sociabilidad',
    enum: SocialLevel,
    example: SocialLevel.FRIENDLY,
  })
  @IsEnum(SocialLevel)
  socialLevel: SocialLevel;

  @ApiPropertyOptional({
    description: 'Se lleva bien con niños',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  goodWithKids?: boolean;

  @ApiPropertyOptional({
    description: 'Se lleva bien con otras mascotas',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  goodWithOtherPets?: boolean;

  @ApiPropertyOptional({
    description: 'Se lleva bien con extraños',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  goodWithStrangers?: boolean;

  // Entrenamiento y habilidades
  @ApiProperty({
    description: 'Nivel de entrenamiento',
    enum: TrainingLevel,
    example: TrainingLevel.BASIC,
  })
  @IsEnum(TrainingLevel)
  trainingLevel: TrainingLevel;

  @ApiProperty({
    description: 'Está entrenado para hacer necesidades en lugar apropiado',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  houseTrained: boolean;

  @ApiPropertyOptional({
    description: 'Está entrenado para caminar con correa',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  leashTrained?: boolean;

  @ApiPropertyOptional({
    description: 'Comandos que conoce',
    example: ['sit', 'stay', 'come', 'down'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  knownCommands?: string[];

  // Cuidados y necesidades
  @ApiProperty({
    description: 'Nivel de cuidado requerido',
    enum: CareLevel,
    example: CareLevel.MODERATE,
  })
  @IsEnum(CareLevel)
  careLevel: CareLevel;

  @ApiProperty({
    description: 'Necesidades de ejercicio',
    example: 'moderate',
    enum: ['low', 'moderate', 'high', 'very_high'],
  })
  @IsString()
  exerciseNeeds: string;

  @ApiProperty({
    description: 'Necesidades de aseo',
    example: 'moderate',
    enum: ['low', 'moderate', 'high'],
  })
  @IsString()
  groomingNeeds: string;

  @ApiProperty({
    description: 'Requiere dieta especial',
    example: false,
  })
  @IsBoolean()
  @Type(() => Boolean)
  specialDiet: boolean;

  @ApiPropertyOptional({
    description: 'Descripción de la dieta especial',
    example: 'Dieta hipoalergénica, sin granos',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  dietDescription?: string;

  // Salud y condiciones médicas
  @ApiPropertyOptional({
    description: 'Condiciones médicas crónicas',
    example: ['artritis', 'diabetes'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  chronicConditions?: string[];

  @ApiPropertyOptional({
    description: 'Medicamentos que toma',
    example: ['insulina', 'antiinflamatorios'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  medications?: string[];

  @ApiPropertyOptional({
    description: 'Alergias conocidas',
    example: ['pollo', 'polen'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergies?: string[];

  @ApiPropertyOptional({
    description: 'Necesidades veterinarias especiales',
    example: 'Revisiones mensuales por diabetes',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  veterinaryNeeds?: string;

  // Comportamientos específicos
  @ApiProperty({
    description: 'Tiene comportamientos destructivos',
    example: false,
  })
  @IsBoolean()
  @Type(() => Boolean)
  destructiveBehavior: boolean;

  @ApiProperty({
    description: 'Sufre de ansiedad por separación',
    example: false,
  })
  @IsBoolean()
  @Type(() => Boolean)
  separationAnxiety: boolean;

  @ApiProperty({
    description: 'Es sensible a ruidos',
    example: false,
  })
  @IsBoolean()
  @Type(() => Boolean)
  noiseSensitivity: boolean;

  @ApiProperty({
    description: 'Tiende a escaparse',
    example: false,
  })
  @IsBoolean()
  @Type(() => Boolean)
  escapeTendency: boolean;

  // Preferencias ambientales
  @ApiPropertyOptional({
    description: 'Tipo de hogar ideal',
    example: 'house_with_yard',
    enum: ['apartment', 'house_no_yard', 'house_small_yard', 'house_large_yard', 'farm'],
  })
  @IsString()
  @IsOptional()
  idealHomeType?: string;

  @ApiProperty({
    description: 'Requerimientos de espacio',
    example: 'moderate',
    enum: ['small', 'moderate', 'large'],
  })
  @IsString()
  spaceRequirements: string;

  @ApiPropertyOptional({
    description: 'Preferencias climáticas',
    example: ['temperate', 'warm'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  climatePreferences?: string[];

  // Historia y background
  @ApiPropertyOptional({
    description: 'Historia de rescate',
    example: 'Encontrado en la calle con desnutrición, ahora completamente recuperado',
    maxLength: 1000,
  })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  rescueStory?: string;

  @ApiPropertyOptional({
    description: 'Experiencia en hogares anteriores',
    example: 'Vivió 2 años en una familia con niños, muy adaptado a la vida doméstica',
    maxLength: 1000,
  })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  previousHomeExperience?: string;

  @ApiPropertyOptional({
    description: 'Notas adicionales sobre comportamiento',
    example: 'Le encanta jugar con pelotas, muy protector con la familia',
    maxLength: 1000,
  })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  behavioralNotes?: string;

  // Compatibilidad calculada
  @ApiProperty({
    description: 'Apropiado para principiantes',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  beginnerFriendly: boolean;

  @ApiProperty({
    description: 'Apropiado para apartamento',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  apartmentSuitable: boolean;

  @ApiProperty({
    description: 'Apropiado para familias',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  familyFriendly: boolean;
}