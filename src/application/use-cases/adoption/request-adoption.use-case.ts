import { Injectable } from '@nestjs/common';
import { AdoptionEntity } from '../../../core/domain/adoption/adoption.entity';
import { AnimalRepository } from '../../../infrastructure/database/mysql/repositories/animal.repository';
import { NotificationService } from '../../../infrastructure/services/notification/notification.service';
import { AdoptionType } from '../../../core/domain/adoption/value-objects/adoption-type.enum';
import { NotificationType } from '../../../core/domain/notification/value-objects/notification-type.enum';
import { BusinessRuleValidationException, EntityNotFoundException } from '../../../core/exceptions/domain.exception';
import { AdoptionRepository } from '../../../infrastructure/database/mysql/repositories/adoption.repository';


interface RequestAdoptionDto {
  animalId: string;
  adopterId: string;
  type: AdoptionType;
  visitDate?: Date;
  notes?: string;
}

@Injectable()
export class RequestAdoptionUseCase {
  constructor(
    private readonly adoptionRepository: AdoptionRepository,
    private readonly animalRepository: AnimalRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async execute(requestAdoptionDto: RequestAdoptionDto): Promise<AdoptionEntity> {
    try {
      const animal = await this.animalRepository.findById(requestAdoptionDto.animalId);
      
      if (!animal.canBeAdopted()) {
        throw new BusinessRuleValidationException(
          'This pet is not available for adoption at this time',
        );
      }
      
      if (animal.getOwnerId() === requestAdoptionDto.adopterId) {
        throw new BusinessRuleValidationException(
          'You cannot request to adopt your own pet',
        );
      }
      
      const existingRequest = await this.adoptionRepository.exists({
        animalId: requestAdoptionDto.animalId,
        adopterId: requestAdoptionDto.adopterId,
        status: 'pending',
      });
      
      if (existingRequest) {
        throw new BusinessRuleValidationException(
          'You already have a pending request for this pet',
        );
      }
      
      if (requestAdoptionDto.type === AdoptionType.VISIT && !requestAdoptionDto.visitDate) {
        throw new BusinessRuleValidationException(
          'You must provide a visit date',
        );
      }
      
      const adoptionEntity = new AdoptionEntity(
        null,
        requestAdoptionDto.animalId,
        animal.getOwnerId(),
        requestAdoptionDto.adopterId,
        requestAdoptionDto.type,
        undefined,
        new Date(),
        undefined,
        undefined,
        requestAdoptionDto.visitDate,
        requestAdoptionDto.notes,
      );
      
      const createdAdoption = await this.adoptionRepository.create(adoptionEntity);
      
      const notificationType = requestAdoptionDto.type === AdoptionType.ADOPTION
        ? NotificationType.ADOPTION_REQUEST
        : NotificationType.VISIT_REQUEST;
      
      const notificationTitle = requestAdoptionDto.type === AdoptionType.ADOPTION
        ? 'New adoption request'
        : 'New visit request';
      
      const notificationMessage = requestAdoptionDto.type === AdoptionType.ADOPTION
        ? `You have received a request to adopt ${animal.getName()}`
        : `You have received a request to visit ${animal.getName()}`;
      
      await this.notificationService.create({
        userId: animal.getOwnerId(),
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        referenceId: createdAdoption.getId(),
        referenceType: 'adoption',
      });
      
      return createdAdoption;
    } catch (error) {
      if (
        error instanceof BusinessRuleValidationException ||
        error instanceof EntityNotFoundException
      ) {
        throw error;
      }
      throw new Error(`Error requesting adoption: ${error.message}`);
    }
  }
}