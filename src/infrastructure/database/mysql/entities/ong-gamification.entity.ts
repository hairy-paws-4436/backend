import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index, ManyToOne,
} from 'typeorm';
import { OngEntity } from './ong.entity';


export enum BadgeType {
  FIRST_ADOPTION = 'first_adoption',
  ADOPTION_MILESTONE_10 = 'adoption_milestone_10',
  ADOPTION_MILESTONE_50 = 'adoption_milestone_50',
  ADOPTION_MILESTONE_100 = 'adoption_milestone_100',
  ADOPTION_MILESTONE_500 = 'adoption_milestone_500',
  PROFILE_COMPLETENESS = 'profile_completeness',
  MONTHLY_ACTIVE = 'monthly_active',
  EVENT_ORGANIZER = 'event_organizer',
  DONOR_FAVORITE = 'donor_favorite',
  COMMUNITY_BUILDER = 'community_builder',
  VETERINARY_PARTNER = 'veterinary_partner',
  TRANSPARENCY_CHAMPION = 'transparency_champion',
  RAPID_RESPONDER = 'rapid_responder',
  SOCIAL_MEDIA_STAR = 'social_media_star',
}

export enum AchievementCategory {
  ADOPTIONS = 'adoptions',
  ENGAGEMENT = 'engagement',
  COMMUNITY = 'community',
  TRANSPARENCY = 'transparency',
  EVENTS = 'events',
  DONATIONS = 'donations',
}

@Entity('ong_gamification')
export class OngGamificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ong_id', unique: true })
  @Index('idx_ong_gamification_ong_id', { unique: true })
  ongId: string;

  // Sistema de puntos
  @Column({
    name: 'total_points',
    type: 'int',
    default: 0,
    comment: 'Puntos totales acumulados'
  })
  totalPoints: number;

  @Column({
    name: 'monthly_points',
    type: 'int',
    default: 0,
    comment: 'Puntos del mes actual'
  })
  monthlyPoints: number;

  @Column({
    name: 'weekly_points',
    type: 'int',
    default: 0,
    comment: 'Puntos de la semana actual'
  })
  weeklyPoints: number;

  // Nivel y ranking
  @Column({
    name: 'current_level',
    type: 'int',
    default: 1,
    comment: 'Nivel actual (1-100)'
  })
  currentLevel: number;

  @Column({
    name: 'points_to_next_level',
    type: 'int',
    default: 100,
    comment: 'Puntos necesarios para el siguiente nivel'
  })
  pointsToNextLevel: number;

  @Column({
    name: 'global_rank',
    type: 'int',
    nullable: true,
    comment: 'Posición en el ranking global'
  })
  globalRank: number;

  @Column({
    name: 'regional_rank',
    type: 'int',
    nullable: true,
    comment: 'Posición en el ranking regional'
  })
  regionalRank: number;

  // Estadísticas de actividad
  @Column({
    name: 'total_adoptions_facilitated',
    type: 'int',
    default: 0,
    comment: 'Total de adopciones facilitadas'
  })
  totalAdoptionsFacilitated: number;

  @Column({
    name: 'animals_published',
    type: 'int',
    default: 0,
    comment: 'Animales publicados en la plataforma'
  })
  animalsPublished: number;

  @Column({
    name: 'events_organized',
    type: 'int',
    default: 0,
    comment: 'Eventos organizados'
  })
  eventsOrganized: number;

  @Column({
    name: 'donations_received',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: 'Total de donaciones recibidas'
  })
  donationsReceived: number;

  @Column({
    name: 'profile_completion_percentage',
    type: 'int',
    default: 0,
    comment: 'Porcentaje de completitud del perfil'
  })
  profileCompletionPercentage: number;

  @Column({
    name: 'response_time_hours',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'Tiempo promedio de respuesta en horas'
  })
  responseTimeHours: number;

  @Column({
    name: 'adoption_success_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    comment: 'Tasa de éxito en adopciones (%)'
  })
  adoptionSuccessRate: number;

  // Rachas y consistencia
  @Column({
    name: 'current_streak_days',
    type: 'int',
    default: 0,
    comment: 'Días consecutivos de actividad'
  })
  currentStreakDays: number;

  @Column({
    name: 'longest_streak_days',
    type: 'int',
    default: 0,
    comment: 'Racha más larga de actividad'
  })
  longestStreakDays: number;

  @Column({
    name: 'last_activity_date',
    type: 'date',
    nullable: true,
    comment: 'Fecha de última actividad'
  })
  lastActivityDate: Date;

  // Badges y logros
  @Column({
    name: 'earned_badges',
    type: 'simple-array',
    comment: 'Badges obtenidos'
  })
  earnedBadges: BadgeType[];

  @Column({
    name: 'featured_badges',
    type: 'simple-array',
    nullable: true,
    comment: 'Badges destacados en el perfil (máximo 3)'
  })
  featuredBadges: BadgeType[];

  // Reconocimientos especiales
  @Column({
    name: 'monthly_recognition_count',
    type: 'int',
    default: 0,
    comment: 'Veces que ha sido reconocida del mes'
  })
  monthlyRecognitionCount: number;

  @Column({
    name: 'community_votes',
    type: 'int',
    default: 0,
    comment: 'Votos positivos de la comunidad'
  })
  communityVotes: number;

  @Column({
    name: 'testimonials_received',
    type: 'int',
    default: 0,
    comment: 'Testimonios positivos recibidos'
  })
  testimonialsReceived: number;

  // Objetivos y metas
  @Column({
    name: 'monthly_adoption_goal',
    type: 'int',
    nullable: true,
    comment: 'Meta mensual de adopciones'
  })
  monthlyAdoptionGoal: number;

  @Column({
    name: 'monthly_adoptions_current',
    type: 'int',
    default: 0,
    comment: 'Adopciones del mes actual'
  })
  monthlyAdoptionsCurrent: number;

  @Column({
    name: 'goal_completion_percentage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    comment: 'Porcentaje de completitud de objetivos'
  })
  goalCompletionPercentage: number;

  // Colaboración y networking
  @Column({
    name: 'partner_ongs_count',
    type: 'int',
    default: 0,
    comment: 'Número de ONGs colaboradoras'
  })
  partnerOngsCount: number;

  @Column({
    name: 'cross_promotions_count',
    type: 'int',
    default: 0,
    comment: 'Promociones cruzadas realizadas'
  })
  crossPromotionsCount: number;

  // Impacto social
  @Column({
    name: 'social_media_mentions',
    type: 'int',
    default: 0,
    comment: 'Menciones en redes sociales'
  })
  socialMediaMentions: number;

  @Column({
    name: 'volunteer_hours_generated',
    type: 'decimal',
    precision: 8,
    scale: 2,
    default: 0,
    comment: 'Horas de voluntariado generadas'
  })
  volunteerHoursGenerated: number;

  // Metadatos del sistema de puntos
  @Column({
    name: 'last_points_calculation',
    type: 'timestamp',
    nullable: true,
    comment: 'Última vez que se calcularon los puntos'
  })
  lastPointsCalculation: Date;

  @Column({
    name: 'weekly_reset_date',
    type: 'date',
    nullable: true,
    comment: 'Fecha del último reset semanal'
  })
  weeklyResetDate: Date;

  @Column({
    name: 'monthly_reset_date',
    type: 'date',
    nullable: true,
    comment: 'Fecha del último reset mensual'
  })
  monthlyResetDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => OngEntity)
  @JoinColumn({ name: 'ong_id' })
  ong: OngEntity;

  @OneToMany(() => OngAchievementEntity, achievement => achievement.ongGamification)
  achievements: OngAchievementEntity[];
}

@Entity('ong_achievements')
export class OngAchievementEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ong_gamification_id' })
  @Index('idx_achievement_ong_gamification')
  ongGamificationId: string;

  @Column({
    type: 'enum',
    enum: BadgeType,
    comment: 'Tipo de logro obtenido'
  })
  badgeType: BadgeType;

  @Column({
    type: 'enum',
    enum: AchievementCategory,
    comment: 'Categoría del logro'
  })
  category: AchievementCategory;

  @Column({
    name: 'points_earned',
    type: 'int',
    comment: 'Puntos obtenidos por este logro'
  })
  pointsEarned: number;

  @Column({
    name: 'achievement_date',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    comment: 'Fecha de obtención del logro'
  })
  achievementDate: Date;

  @Column({
    name: 'milestone_value',
    type: 'int',
    nullable: true,
    comment: 'Valor del hito alcanzado'
  })
  milestoneValue: number;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Descripción del contexto del logro'
  })
  description: string;

  @Column({
    name: 'is_featured',
    type: 'boolean',
    default: false,
    comment: 'Está destacado en el perfil'
  })
  isFeatured: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => OngGamificationEntity, gamification => gamification.achievements)
  @JoinColumn({ name: 'ong_gamification_id' })
  ongGamification: OngGamificationEntity;
}