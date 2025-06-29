import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min
} from 'class-validator';
import { Type } from 'class-transformer';
import { AdaptationLevel } from '../../../infrastructure/database/mysql/entities/post-adoption-followup.entity';


export class CompleteFollowUpDto {
  @ApiProperty({
    description: 'Nivel de adaptación general',
    enum: AdaptationLevel,
    example: AdaptationLevel.GOOD,
  })
  @IsEnum(AdaptationLevel)
  adaptationLevel: AdaptationLevel;

  @ApiProperty({
    description: '¿Está comiendo bien?',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  eatingWell: boolean;

  @ApiProperty({
    description: '¿Está durmiendo bien?',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  sleepingWell: boolean;

  @ApiProperty({
    description: '¿Está usando el baño apropiadamente?',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  usingBathroomProperly: boolean;

  @ApiProperty({
    description: '¿Muestra afecto hacia la familia?',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  showingAffection: boolean;

  @ApiPropertyOptional({
    description: 'Problemas de comportamiento observados',
    example: ['ansiedad por separación', 'ladridos excesivos'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  behavioralIssues?: string[];

  @ApiPropertyOptional({
    description: 'Preocupaciones de salud',
    example: ['cojera leve', 'pérdida de apetito ocasional'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  healthConcerns?: string[];

  @ApiProperty({
    description: '¿Tiene visita veterinaria programada?',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  vetVisitScheduled: boolean;

  @ApiPropertyOptional({
    description: 'Fecha de la visita veterinaria (YYYY-MM-DD)',
    example: '2024-01-15',
  })
  @IsString()
  @IsOptional()
  vetVisitDate?: string;

  @ApiProperty({
    description: 'Puntuación de satisfacción (1-10)',
    example: 9,
    minimum: 1,
    maximum: 10,
  })
  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  satisfactionScore: number;

  @ApiProperty({
    description: '¿Recomendaría adoptar de esta ONG?',
    example: true,
  })
  @IsBoolean()
  @Type(() => Boolean)
  wouldRecommend: boolean;

  @ApiPropertyOptional({
    description: 'Comentarios adicionales',
    example: 'La mascota se ha adaptado perfectamente. Muy agradecidos con la ONG por todo el apoyo.',
    maxLength: 1000,
  })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  additionalComments?: string;

  @ApiProperty({
    description: 'Necesita apoyo adicional',
    example: false,
  })
  @IsBoolean()
  @Type(() => Boolean)
  needsSupport: boolean;

  @ApiPropertyOptional({
    description: 'Tipo de apoyo necesario',
    example: ['entrenamiento', 'asesoría veterinaria'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  supportType?: string[];
}