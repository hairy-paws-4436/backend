import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AdoptionEntity } from './adoption.entity';
import { UserEntity } from './user.entity';


export enum FollowUpStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
  OVERDUE = 'overdue',
}

export enum AdaptationLevel {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  CONCERNING = 'concerning',
}

export enum FollowUpType {
  INITIAL_3_DAYS = 'initial_3_days',
  WEEK_1 = 'week_1',
  WEEK_2 = 'week_2',
  MONTH_1 = 'month_1',
  MONTH_3 = 'month_3',
  MONTH_6 = 'month_6',
  YEAR_1 = 'year_1',
  CUSTOM = 'custom',
}

@Entity('post_adoption_followups')
export class PostAdoptionFollowUpEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'adoption_id' })
  @Index('idx_followup_adoption')
  adoptionId: string;

  @Column({ name: 'adopter_id' })
  @Index('idx_followup_adopter')
  adopterId: string;

  @Column({
    type: 'enum',
    enum: FollowUpType,
    comment: 'Tipo de seguimiento'
  })
  followUpType: FollowUpType;

  @Column({
    type: 'enum',
    enum: FollowUpStatus,
    default: FollowUpStatus.PENDING,
    comment: 'Estado del seguimiento'
  })
  status: FollowUpStatus;

  @Column({
    name: 'scheduled_date',
    type: 'timestamp',
    comment: 'Fecha programada para el seguimiento'
  })
  scheduledDate: Date;

  @Column({
    name: 'completed_date',
    type: 'timestamp',
    nullable: true,
    comment: 'Fecha de finalización del seguimiento'
  })
  completedDate: Date;

  // Respuestas del cuestionario
  @Column({
    type: 'enum',
    enum: AdaptationLevel,
    nullable: true,
    comment: 'Nivel de adaptación general'
  })
  adaptationLevel: AdaptationLevel;

  @Column({
    name: 'eating_well',
    type: 'boolean',
    nullable: true,
    comment: '¿Está comiendo bien?'
  })
  eatingWell: boolean;

  @Column({
    name: 'sleeping_well',
    type: 'boolean',
    nullable: true,
    comment: '¿Está durmiendo bien?'
  })
  sleepingWell: boolean;

  @Column({
    name: 'using_bathroom_properly',
    type: 'boolean',
    nullable: true,
    comment: '¿Está usando el baño apropiadamente?'
  })
  usingBathroomProperly: boolean;

  @Column({
    name: 'showing_affection',
    type: 'boolean',
    nullable: true,
    comment: '¿Muestra afecto hacia la familia?'
  })
  showingAffection: boolean;

  @Column({
    name: 'behavioral_issues',
    type: 'simple-array',
    nullable: true,
    comment: 'Problemas de comportamiento observados'
  })
  behavioralIssues: string[];

  @Column({
    name: 'health_concerns',
    type: 'simple-array',
    nullable: true,
    comment: 'Preocupaciones de salud'
  })
  healthConcerns: string[];

  @Column({
    name: 'vet_visit_scheduled',
    type: 'boolean',
    nullable: true,
    comment: '¿Tiene visita veterinaria programada?'
  })
  vetVisitScheduled: boolean;

  @Column({
    name: 'vet_visit_date',
    type: 'date',
    nullable: true,
    comment: 'Fecha de la visita veterinaria'
  })
  vetVisitDate: Date;

  @Column({
    name: 'satisfaction_score',
    type: 'int',
    nullable: true,
    comment: 'Puntuación de satisfacción (1-10)'
  })
  satisfactionScore: number;

  @Column({
    name: 'would_recommend',
    type: 'boolean',
    nullable: true,
    comment: '¿Recomendaría adoptar de esta ONG?'
  })
  wouldRecommend: boolean;

  @Column({
    name: 'additional_comments',
    type: 'text',
    nullable: true,
    comment: 'Comentarios adicionales'
  })
  additionalComments: string;

  @Column({
    name: 'needs_support',
    type: 'boolean',
    default: false,
    comment: 'Necesita apoyo adicional'
  })
  needsSupport: boolean;

  @Column({
    name: 'support_type',
    type: 'simple-array',
    nullable: true,
    comment: 'Tipo de apoyo necesario'
  })
  supportType: string[];

  @Column({
    name: 'follow_up_required',
    type: 'boolean',
    default: false,
    comment: 'Requiere seguimiento adicional'
  })
  followUpRequired: boolean;

  @Column({
    name: 'risk_level',
    type: 'varchar',
    length: 20,
    default: 'low',
    comment: 'Nivel de riesgo (low, medium, high, critical)'
  })
  riskLevel: string;

  // Metadatos
  @Column({
    name: 'reminder_sent',
    type: 'boolean',
    default: false,
    comment: 'Se envió recordatorio'
  })
  reminderSent: boolean;

  @Column({
    name: 'reminder_count',
    type: 'int',
    default: 0,
    comment: 'Número de recordatorios enviados'
  })
  reminderCount: number;

  @Column({
    name: 'last_reminder_date',
    type: 'timestamp',
    nullable: true,
    comment: 'Fecha del último recordatorio'
  })
  lastReminderDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => AdoptionEntity)
  @JoinColumn({ name: 'adoption_id' })
  adoption: AdoptionEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'adopter_id' })
  adopter: UserEntity;
}