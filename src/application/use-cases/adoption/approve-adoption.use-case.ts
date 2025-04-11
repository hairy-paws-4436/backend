import { Injectable } from '@nestjs/common';
import { AdoptionEntity } from '../../../core/domain/adoption/adoption.entity';
import { AdoptionRepository } from '../../../infrastructure/database/mysql/repositories/adoption.repository';
import { AnimalRepository } from '../../../infrastructure/database/mysql/repositories/animal.repository';
import { NotificationService } from '../../../infrastructure/services/notification/notification.service';
import { NotificationType } from '../../../core/domain/notification/value-objects/notification-type.enum';
import { AdoptionType } from '../../../core/domain/adoption/value-objects/adoption-type.enum';
import { BusinessRuleValidationException, EntityNotFoundException } from '../../../core/exceptions/domain.exception';

interface ApproveAdoptionDto {
  adoptionId: string;
  notes?: string;
}

@Injectable()
export class ApproveAdoptionUseCase {
  constructor(
    private readonly adoptionRepository: AdoptionRepository,
    private readonly animalRepository: AnimalRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async execute(approveAdoptionDto: ApproveAdoptionDto): Promise<AdoptionEntity> {
    try {
      // Obtener la solicitud
      const adoption = await this.adoptionRepository.findById(approveAdoptionDto.adoptionId);
      
      // Verificar que esté en estado pendiente
      if (!adoption.isPending()) {
        throw new BusinessRuleValidationException(
          'Solo se pueden aprobar solicitudes pendientes',
        );
      }
      
      // Aprobar la solicitud
      adoption.approve();
      
      // Actualizar notas si se proporcionan
      if (approveAdoptionDto.notes) {
        adoption.updateNotes(approveAdoptionDto.notes);
      }
      
      // Guardar la solicitud
      const updatedAdoption = await this.adoptionRepository.update(
        approveAdoptionDto.adoptionId,
        adoption,
      );
      
      // Si es una solicitud de adopción (no de visita), marcar al animal como adoptado
      if (adoption.isAdoption()) {
        const animal = await this.animalRepository.findById(adoption.getAnimalId());
        animal.markAsAdopted();
        await this.animalRepository.update(animal.getId(), animal);
      }
      
      // Enviar notificación al adoptante
      const notificationType = adoption.isAdoption()
        ? NotificationType.ADOPTION_APPROVED
        : NotificationType.VISIT_APPROVED;
        
      const notificationTitle = adoption.isAdoption()
        ? 'Solicitud de adopción aprobada'
        : 'Solicitud de visita aprobada';
        
      const notificationMessage = adoption.isAdoption()
        ? 'Tu solicitud de adopción ha sido aprobada. ¡Felicidades!'
        : `Tu solicitud de visita ha sido aprobada para ${adoption.getVisitDate()?.toLocaleString() || 'la fecha indicada'}`;
      
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
      throw new Error(`Error al aprobar solicitud de adopción: ${error.message}`);
    }
  }
}