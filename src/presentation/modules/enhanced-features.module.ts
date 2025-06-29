import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { UserPreferencesEntity } from '../../infrastructure/database/mysql/entities/user-preferences.entity';
import { AnimalProfileEntity } from '../../infrastructure/database/mysql/entities/animal-profile.entity';
import { PostAdoptionFollowUpEntity } from '../../infrastructure/database/mysql/entities/post-adoption-followup.entity';
import {
  NotificationPreferencesEntity
} from '../../infrastructure/database/mysql/entities/notification-preferences.entity';
import {
  OngAchievementEntity,
  OngGamificationEntity,
} from '../../infrastructure/database/mysql/entities/ong-gamification.entity';
import { NotificationModule } from './notification.module';
import { UserModule } from './user.module';
import { AnimalModule } from './animal.module';
import { AdoptionModule } from './adoption.module';
import { OngModule } from './ong.module';
import { MatchingController } from '../controllers/matching.controller';
import { NotificationPreferencesController } from '../controllers/notification-preferences.controller';
import { PostAdoptionController } from '../controllers/post-adoption.controller';
import { GamificationController } from '../controllers/gamification.controller';
import {
  UserPreferencesRepository
} from '../../infrastructure/database/mysql/repositories/user-preferences.repository';
import { AnimalProfileRepository } from '../../infrastructure/database/mysql/repositories/animal-profile.repository';
import { CompleteOnboardingUseCase } from '../../application/use-cases/user/complete-onboarding.use-case';
import { TaskSchedulerService } from '../../application/services/task-scheduler.service';
import { PostAdoptionFollowUpService } from '../../application/services/post-adoption-followup.service';
import { NotificationPreferencesService } from '../../application/services/notification-preferences.service';
import { OngGamificationService } from '../../application/services/ong-gamification.service';
import { IntelligentMatchingService } from '../../application/services/intelligent-matching.service';
import { AdoptionRepository } from '../../infrastructure/database/mysql/repositories/adoption.repository';
import { AnimalEntity } from '../../infrastructure/database/mysql/entities/animal.entity';
import { AdoptionEntity } from '../../infrastructure/database/mysql/entities/adoption.entity';


@Module({
  imports: [
    ScheduleModule.forRoot(), // Para las tareas programadas

    TypeOrmModule.forFeature([
      // Experimento 1: Matching inteligente
      UserPreferencesEntity,
      AnimalProfileEntity,
      AnimalEntity,
      AdoptionEntity,
      // Experimento 2: Seguimiento post-adopción
      PostAdoptionFollowUpEntity,

      // Experimento 3: Personalización de notificaciones
      NotificationPreferencesEntity,

      // Experimento 5: Gamificación ONGs
      OngGamificationEntity,
      OngAchievementEntity,
    ]),

    // Módulos existentes necesarios
    NotificationModule,
    UserModule,
    AnimalModule,
    AdoptionModule,
    OngModule,
  ],

  controllers: [
    MatchingController,
    NotificationPreferencesController,
    PostAdoptionController,
    GamificationController,
  ],

  providers: [
    // Repositorios
    UserPreferencesRepository,
    AnimalProfileRepository,
    AdoptionRepository,
    // Servicios principales
    IntelligentMatchingService,
    OngGamificationService,
    NotificationPreferencesService,
    PostAdoptionFollowUpService,
    TaskSchedulerService,

    // Casos de uso
    CompleteOnboardingUseCase,
  ],

  exports: [
    // Servicios que pueden ser utilizados por otros módulos
    IntelligentMatchingService,
    OngGamificationService,
    NotificationPreferencesService,
    PostAdoptionFollowUpService,
    UserPreferencesRepository,
    AnimalProfileRepository,
  ],
})
export class EnhancedFeaturesModule {}