import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { AnimalType } from '../../../../core/domain/animal/value-objects/animal-type.enum';
import { AnimalGender } from '../../../../core/domain/animal/value-objects/animal-gender.enum';

export enum ExperienceLevel {
  FIRST_TIME = 'first_time',
  SOME_EXPERIENCE = 'some_experience',
  EXPERIENCED = 'experienced',
  EXPERT = 'expert',
}

export enum HousingType {
  APARTMENT = 'apartment',
  HOUSE_NO_YARD = 'house_no_yard',
  HOUSE_SMALL_YARD = 'house_small_yard',
  HOUSE_LARGE_YARD = 'house_large_yard',
  FARM = 'farm',
}

export enum ActivityLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

export enum TimeAvailability {
  MINIMAL = 'minimal', // < 2 horas/día
  LIMITED = 'limited', // 2-4 horas/día
  MODERATE = 'moderate', // 4-6 horas/día
  EXTENSIVE = 'extensive', // > 6 horas/día
}

export enum FamilyComposition {
  SINGLE = 'single',
  COUPLE = 'couple',
  FAMILY_YOUNG_KIDS = 'family_young_kids', // < 5 años
  FAMILY_OLDER_KIDS = 'family_older_kids', // > 5 años
  ELDERLY = 'elderly',
}

@Entity('user_preferences')
export class UserPreferencesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  @Index('idx_user_preferences_user_id', { unique: true })
  userId: string;

  // Preferencias básicas de mascotas
  @Column({
    type: 'simple-array',
    nullable: true,
    comment: 'Tipos de animales preferidos'
  })
  preferredAnimalTypes: AnimalType[];

  @Column({
    type: 'simple-array',
    nullable: true,
    comment: 'Géneros preferidos'
  })
  preferredGenders: AnimalGender[];

  @Column({
    name: 'min_age',
    type: 'int',
    nullable: true,
    comment: 'Edad mínima preferida en años'
  })
  minAge: number;

  @Column({
    name: 'max_age',
    type: 'int',
    nullable: true,
    comment: 'Edad máxima preferida en años'
  })
  maxAge: number;

  @Column({
    name: 'min_size',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'Peso mínimo preferido en kg'
  })
  minSize: number;

  @Column({
    name: 'max_size',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'Peso máximo preferido en kg'
  })
  maxSize: number;

  // Experiencia y conocimiento
  @Column({
    type: 'enum',
    enum: ExperienceLevel,
    default: ExperienceLevel.FIRST_TIME,
    comment: 'Nivel de experiencia con mascotas'
  })
  experienceLevel: ExperienceLevel;

  @Column({
    type: 'simple-array',
    nullable: true,
    comment: 'Experiencia previa con tipos específicos de animales'
  })
  previousPetTypes: AnimalType[];

  // Situación del hogar
  @Column({
    type: 'enum',
    enum: HousingType,
    default: HousingType.APARTMENT,
    comment: 'Tipo de vivienda'
  })
  housingType: HousingType;

  @Column({
    type: 'enum',
    enum: FamilyComposition,
    default: FamilyComposition.SINGLE,
    comment: 'Composición familiar'
  })
  familyComposition: FamilyComposition;

  @Column({
    name: 'has_other_pets',
    type: 'boolean',
    default: false,
    comment: 'Tiene otras mascotas en casa'
  })
  hasOtherPets: boolean;

  @Column({
    name: 'other_pets_description',
    type: 'text',
    nullable: true,
    comment: 'Descripción de otras mascotas'
  })
  otherPetsDescription: string;

  // Tiempo y actividad
  @Column({
    type: 'enum',
    enum: TimeAvailability,
    default: TimeAvailability.LIMITED,
    comment: 'Tiempo disponible diario para la mascota'
  })
  timeAvailability: TimeAvailability;

  @Column({
    type: 'enum',
    enum: ActivityLevel,
    default: ActivityLevel.MODERATE,
    comment: 'Nivel de actividad preferido'
  })
  preferredActivityLevel: ActivityLevel;

  @Column({
    name: 'work_schedule',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Horario de trabajo (morning, afternoon, night, flexible)'
  })
  workSchedule: string;

  // Preferencias específicas
  @Column({
    name: 'prefers_trained',
    type: 'boolean',
    default: false,
    comment: 'Prefiere mascotas ya entrenadas'
  })
  prefersTrained: boolean;

  @Column({
    name: 'accepts_special_needs',
    type: 'boolean',
    default: false,
    comment: 'Acepta mascotas con necesidades especiales'
  })
  acceptsSpecialNeeds: boolean;

  @Column({
    name: 'prefers_vaccinated',
    type: 'boolean',
    default: true,
    comment: 'Prefiere mascotas vacunadas'
  })
  prefersVaccinated: boolean;

  @Column({
    name: 'prefers_sterilized',
    type: 'boolean',
    default: true,
    comment: 'Prefiere mascotas esterilizadas'
  })
  prefersSterilized: boolean;

  // Ubicación y distancia
  @Column({
    name: 'max_distance_km',
    type: 'int',
    default: 50,
    comment: 'Distancia máxima dispuesta a viajar en km'
  })
  maxDistanceKm: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 8,
    nullable: true,
    comment: 'Latitud de ubicación'
  })
  latitude: number;

  @Column({
    type: 'decimal',
    precision: 11,
    scale: 8,
    nullable: true,
    comment: 'Longitud de ubicación'
  })
  longitude: number;

  // Presupuesto
  @Column({
    name: 'monthly_budget',
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
    comment: 'Presupuesto mensual estimado para la mascota'
  })
  monthlyBudget: number;

  // Razones y motivación
  @Column({
    name: 'adoption_reason',
    type: 'text',
    nullable: true,
    comment: 'Razón principal para adoptar'
  })
  adoptionReason: string;

  @Column({
    name: 'lifestyle_description',
    type: 'text',
    nullable: true,
    comment: 'Descripción del estilo de vida'
  })
  lifestyleDescription: string;

  // Metadatos
  @Column({
    name: 'is_complete',
    type: 'boolean',
    default: false,
    comment: 'Indica si el cuestionario está completo'
  })
  isComplete: boolean;

  @Column({
    name: 'completion_date',
    type: 'timestamp',
    nullable: true,
    comment: 'Fecha de finalización del cuestionario'
  })
  completionDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}