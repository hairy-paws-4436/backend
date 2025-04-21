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
      const adoption = await this.adoptionRepository.findById(approveAdoptionDto.adoptionId);
      
      if (!adoption.isPending()) {
        throw new BusinessRuleValidationException(
          'Only pending requests can be approved',
        );
      }
      
      adoption.approve();
      
      if (approveAdoptionDto.notes) {
        adoption.updateNotes(approveAdoptionDto.notes);
      }
      
      const updatedAdoption = await this.adoptionRepository.update(
        approveAdoptionDto.adoptionId,
        adoption,
      );
      
      if (adoption.isAdoption()) {
        const animal = await this.animalRepository.findById(adoption.getAnimalId());
        animal.markAsAdopted();
        await this.animalRepository.update(animal.getId(), animal);
      }
      
      const notificationType = adoption.isAdoption()
        ? NotificationType.ADOPTION_APPROVED
        : NotificationType.VISIT_APPROVED;
        
      const notificationTitle = adoption.isAdoption()
        ? 'Adoption request approved'
        : 'Visit request approved';
        
      const notificationMessage = adoption.isAdoption()
        ? 'Your adoption request has been approved. Congratulations!'
        : `Your visit request has been approved for ${adoption.getVisitDate()?.toLocaleString() || 'the indicated date'}`;
      
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
      throw new Error(`Error approving adoption request: ${error.message}`);
    }
  }
}
