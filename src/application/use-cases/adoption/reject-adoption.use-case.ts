import { Injectable } from '@nestjs/common';
import { AdoptionEntity } from '../../../core/domain/adoption/adoption.entity';
import { AdoptionRepository } from '../../../infrastructure/database/mysql/repositories/adoption.repository';
import { NotificationService } from '../../../infrastructure/services/notification/notification.service';
import { NotificationType } from '../../../core/domain/notification/value-objects/notification-type.enum';
import { BusinessRuleValidationException, EntityNotFoundException } from '../../../core/exceptions/domain.exception';

interface RejectAdoptionDto {
  adoptionId: string;
  reason: string;
}

@Injectable()
export class RejectAdoptionUseCase {
  constructor(
    private readonly adoptionRepository: AdoptionRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async execute(rejectAdoptionDto: RejectAdoptionDto): Promise<AdoptionEntity> {
    try {
      // Obtener la solicitud
      const adoption = await this.adoptionRepository.findById(rejectAdoptionDto.adoptionId);
      
      // Verificar que esté en estado pendiente
      if (!adoption.isPending()) {
        throw new BusinessRuleValidationException(
          'Solo se pueden rechazar solicitudes pendientes',
        );
      }
      
      // Rechazar la solicitud
      adoption.reject(rejectAdoptionDto.reason);
      
      // Guardar la solicitud
      const updatedAdoption = await this.adoptionRepository.update(
        rejectAdoptionDto.adoptionId,
        adoption,
      );
      
      // Enviar notificación al adoptante
      const notificationType = adoption.isAdoption()
        ? NotificationType.ADOPTION_REJECTED
        : NotificationType.VISIT_REJECTED;
        
      const notificationTitle = adoption.isAdoption()
        ? 'Solicitud de adopción rechazada'
        : 'Solicitud de visita rechazada';
        
      const notificationMessage = `Tu solicitud ha sido rechazada. Motivo: ${rejectAdoptionDto.reason}`;
      
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
      throw new Error(`Error al rechazar solicitud de adopción: ${error.message}`);
    }
  }
}