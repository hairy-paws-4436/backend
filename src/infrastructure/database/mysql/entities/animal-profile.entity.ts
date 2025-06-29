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
import { AnimalEntity } from './animal.entity';

export enum EnergyLevel {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

export enum SocialLevel {
  SHY = 'shy',
  RESERVED = 'reserved',
  FRIENDLY = 'friendly',
  VERY_SOCIAL = 'very_social',
  DOMINANT = 'dominant',
}

export enum TrainingLevel {
  UNTRAINED = 'untrained',
  BASIC = 'basic',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  PROFESSIONAL = 'professional',
}

export enum CareLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  SPECIAL_NEEDS = 'special_needs',
}

@Entity('animal_profiles')
export class AnimalProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'animal_id', unique: true })
  @Index('idx_animal_profile_animal_id', { unique: true })
  animalId: string;

  // Personalidad y comportamiento
  @Column({
    type: 'enum',
    enum: EnergyLevel,
    default: EnergyLevel.MODERATE,
    comment: 'Nivel de energía del animal'
  })
  energyLevel: EnergyLevel;

  @Column({
    type: 'enum',
    enum: SocialLevel,
    default: SocialLevel.FRIENDLY,
    comment: 'Nivel de sociabilidad'
  })
  socialLevel: SocialLevel;

  @Column({
    name: 'good_with_kids',
    type: 'boolean',
    nullable: true,
    comment: 'Se lleva bien con niños'
  })
  goodWithKids: boolean;

  @Column({
    name: 'good_with_other_pets',
    type: 'boolean',
    nullable: true,
    comment: 'Se lleva bien con otras mascotas'
  })
  goodWithOtherPets: boolean;

  @Column({
    name: 'good_with_strangers',
    type: 'boolean',
    nullable: true,
    comment: 'Se lleva bien con extraños'
  })
  goodWithStrangers: boolean;

  // Entrenamiento y habilidades
  @Column({
    type: 'enum',
    enum: TrainingLevel,
    default: TrainingLevel.UNTRAINED,
    comment: 'Nivel de entrenamiento'
  })
  trainingLevel: TrainingLevel;

  @Column({
    name: 'house_trained',
    type: 'boolean',
    default: false,
    comment: 'Está entrenado para hacer necesidades en lugar apropiado'
  })
  houseTrained: boolean;

  @Column({
    name: 'leash_trained',
    type: 'boolean',
    nullable: true,
    comment: 'Está entrenado para caminar con correa'
  })
  leashTrained: boolean;

  @Column({
    name: 'known_commands',
    type: 'simple-array',
    nullable: true,
    comment: 'Comandos que conoce'
  })
  knownCommands: string[];

  // Cuidados y necesidades
  @Column({
    type: 'enum',
    enum: CareLevel,
    default: CareLevel.MODERATE,
    comment: 'Nivel de cuidado requerido'
  })
  careLevel: CareLevel;

  @Column({
    name: 'exercise_needs',
    type: 'varchar',
    length: 20,
    default: 'moderate',
    comment: 'Necesidades de ejercicio (low, moderate, high, very_high)'
  })
  exerciseNeeds: string;

  @Column({
    name: 'grooming_needs',
    type: 'varchar',
    length: 20,
    default: 'moderate',
    comment: 'Necesidades de aseo (low, moderate, high)'
  })
  groomingNeeds: string;

  @Column({
    name: 'special_diet',
    type: 'boolean',
    default: false,
    comment: 'Requiere dieta especial'
  })
  specialDiet: boolean;

  @Column({
    name: 'diet_description',
    type: 'text',
    nullable: true,
    comment: 'Descripción de la dieta especial'
  })
  dietDescription: string;

  // Salud y condiciones médicas
  @Column({
    name: 'chronic_conditions',
    type: 'simple-array',
    nullable: true,
    comment: 'Condiciones médicas crónicas'
  })
  chronicConditions: string[];

  @Column({
    name: 'medications',
    type: 'simple-array',
    nullable: true,
    comment: 'Medicamentos que toma'
  })
  medications: string[];

  @Column({
    name: 'allergies',
    type: 'simple-array',
    nullable: true,
    comment: 'Alergias conocidas'
  })
  allergies: string[];

  @Column({
    name: 'veterinary_needs',
    type: 'text',
    nullable: true,
    comment: 'Necesidades veterinarias especiales'
  })
  veterinaryNeeds: string;

  // Comportamientos específicos
  @Column({
    name: 'destructive_behavior',
    type: 'boolean',
    default: false,
    comment: 'Tiene comportamientos destructivos'
  })
  destructiveBehavior: boolean;

  @Column({
    name: 'separation_anxiety',
    type: 'boolean',
    default: false,
    comment: 'Sufre de ansiedad por separación'
  })
  separationAnxiety: boolean;

  @Column({
    name: 'noise_sensitivity',
    type: 'boolean',
    default: false,
    comment: 'Es sensible a ruidos'
  })
  noiseSensitivity: boolean;

  @Column({
    name: 'escape_tendency',
    type: 'boolean',
    default: false,
    comment: 'Tiende a escaparse'
  })
  escapeTendency: boolean;

  // Preferencias ambientales
  @Column({
    name: 'ideal_home_type',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Tipo de hogar ideal'
  })
  idealHomeType: string;

  @Column({
    name: 'space_requirements',
    type: 'varchar',
    length: 20,
    default: 'moderate',
    comment: 'Requerimientos de espacio (small, moderate, large)'
  })
  spaceRequirements: string;

  @Column({
    name: 'climate_preferences',
    type: 'simple-array',
    nullable: true,
    comment: 'Preferencias climáticas'
  })
  climatePreferences: string[];

  // Historia y background
  @Column({
    name: 'rescue_story',
    type: 'text',
    nullable: true,
    comment: 'Historia de rescate'
  })
  rescueStory: string;

  @Column({
    name: 'previous_home_experience',
    type: 'text',
    nullable: true,
    comment: 'Experiencia en hogares anteriores'
  })
  previousHomeExperience: string;

  @Column({
    name: 'behavioral_notes',
    type: 'text',
    nullable: true,
    comment: 'Notas adicionales sobre comportamiento'
  })
  behavioralNotes: string;

  // Compatibilidad calculada
  @Column({
    name: 'beginner_friendly',
    type: 'boolean',
    default: true,
    comment: 'Apropiado para principiantes'
  })
  beginnerFriendly: boolean;

  @Column({
    name: 'apartment_suitable',
    type: 'boolean',
    default: true,
    comment: 'Apropiado para apartamento'
  })
  apartmentSuitable: boolean;

  @Column({
    name: 'family_friendly',
    type: 'boolean',
    default: true,
    comment: 'Apropiado para familias'
  })
  familyFriendly: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => AnimalEntity)
  @JoinColumn({ name: 'animal_id' })
  animal: AnimalEntity;
}