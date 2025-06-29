import { Injectable } from '@nestjs/common';
import { UserPreferencesRepository } from '../../../infrastructure/database/mysql/repositories/user-preferences.repository';
import { IntelligentMatchingService } from '../../../application/services/intelligent-matching.service';
import { NotificationService } from '../../../infrastructure/services/notification/notification.service';
import { NotificationType } from '../../../core/domain/notification/value-objects/notification-type.enum';
import { CreateUserPreferencesDto } from '../../../presentation/dtos/requests/create-user-preferences.dto';

interface CompleteOnboardingDto extends CreateUserPreferencesDto {
  userId: string;
}

@Injectable()
export class CompleteOnboardingUseCase {
  constructor(
    private readonly userPreferencesRepository: UserPreferencesRepository,
    private readonly matchingService: IntelligentMatchingService,
    private readonly notificationService: NotificationService,
  ) {}

  async execute(dto: CompleteOnboardingDto) {
    try {
      // 1. Guardar preferencias del usuario
      const existingPreferences = await this.userPreferencesRepository.findByUserIdOptional(dto.userId);

      let preferences;
      if (existingPreferences) {
        preferences = await this.userPreferencesRepository.update(dto.userId, {
          ...dto,
          isComplete: true,
          completionDate: new Date(),
        });
      } else {
        preferences = await this.userPreferencesRepository.create({
          ...dto,
          userId: dto.userId,
          isComplete: true,
          completionDate: new Date(),
        });
      }

      // 2. Generar recomendaciones iniciales
      const initialMatches = await this.matchingService.findMatches({
        userId: dto.userId,
        limit: 5,
        minScore: 0.4,
        includeSpecialNeeds: dto.acceptsSpecialNeeds,
      });

      // 3. Enviar notificación de bienvenida con recomendaciones
      if (initialMatches.length > 0) {
        await this.notificationService.create({
          userId: dto.userId,
          type: NotificationType.GENERAL,
          title: '¡Perfil completado! 🎉',
          message: `Hemos encontrado ${initialMatches.length} mascotas que podrían ser perfectas para ti. ¡Revisa tus recomendaciones personalizadas!`,
        });
      } else {
        await this.notificationService.create({
          userId: dto.userId,
          type: NotificationType.GENERAL,
          title: '¡Perfil completado! 🎉',
          message: 'Gracias por completar tu perfil. Te notificaremos cuando tengamos mascotas que coincidan con tus preferencias.',
        });
      }

      return {
        preferences,
        initialMatches: initialMatches.slice(0, 3), // Solo las top 3 para el resumen
        totalMatches: initialMatches.length,
        onboardingComplete: true,
      };
    } catch (error) {
      throw new Error(`Error completing onboarding: ${error.message}`);
    }
  }
}