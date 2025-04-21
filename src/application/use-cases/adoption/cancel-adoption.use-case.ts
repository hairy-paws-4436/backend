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
      const adoption = await this.adoptionRepository.findById(cancelAdoptionDto.adoptionId);
      
      adoption.cancel();
      
      const updatedAdoption = await this.adoptionRepository.update(
        cancelAdoptionDto.adoptionId,
        adoption,
      );
      
      const notificationType = NotificationType.GENERAL;
      const notificationTitle = adoption.isAdoption()
        ? 'Adoption request canceled'
        : 'Visit request canceled';
      
      const notificationMessage = adoption.isAdoption()
        ? 'An adoption request has been canceled'
        : 'A visit request has been canceled';
      
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
      throw new Error(`Error canceling adoption request: ${error.message}`);
    }
  }
}
