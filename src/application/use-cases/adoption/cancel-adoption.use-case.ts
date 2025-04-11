import { Injectable } from '@nestjs/common';
import { AdoptionEntity } from '../../../core/domain/adoption/adoption.entity';
import { AdoptionRepository } from '../../../infrastructure/database/mysql/repositories/adoption.repository';
import { NotificationService } from '../../../infrastructure/services/notification/notification.service';
import { NotificationType } from '../../../core/domain/notification/value-objects/notification-type.enum';
import { BusinessRuleValidationException, EntityNotFoundException } from '../../../core/exceptions/domain.exception';

interface CancelAdoptionDto {
  adoptionId: string;
}

@Injectable()
export class CancelAdoptionUseCase {
  constructor(
    private readonly adoptionRepository: AdoptionRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async execute(cancelAdoptionDto: CancelAdoptionDto): Promise<AdoptionEntity> {
    try {
      // Obtener la solicitud
      const adoption = await this.adoptionRepository.findById(cancelAdoptionDto.adoptionId);
      
      // Cancelar la solicitud (el método interno verificará si se puede cancelar)
      adoption.cancel();
      
      // Guardar la solicitud
      const updatedAdoption = await this.adoptionRepository.update(
        cancelAdoptionDto.adoptionId,
        adoption,
      );
      
      // Notificar a la otra parte involucrada (si el que cancela es el adoptante, notificar al dueño y viceversa)
      // Acá asumimos que el userId que viene en el DTO es el que está cancelando
      const notificationType = NotificationType.GENERAL;
      const notificationTitle = adoption.isAdoption()
        ? 'Solicitud de adopción cancelada'
        : 'Solicitud de visita cancelada';
      
      const notificationMessage = adoption.isAdoption()
        ? 'Una solicitud de adopción ha sido cancelada'
        : 'Una solicitud de visita ha sido cancelada';
      
      // Notificar a ambos participantes
      await this.notificationService.create({
        userId: adoption.getOwnerId(),
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        referenceId: adoption.getId(),
        referenceType: 'adoption',
      });
      
      await this.notificationService.create({
        userId: adoption.getAdopterId(),
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        referenceId: adoption.getId(),
        referenceType: 'adoption',
      });
      
      return updatedAdoption;
    } catch (error) {
      if (
        error instanceof BusinessRuleValidationException ||
        error instanceof EntityNotFoundException
      ) {
        throw error;
      }
      throw new Error(`Error al cancelar solicitud de adopción: ${error.message}`);
    }
  }
}