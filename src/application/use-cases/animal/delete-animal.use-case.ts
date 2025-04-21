import { Injectable } from '@nestjs/common';
import { AnimalRepository } from '../../../infrastructure/database/mysql/repositories/animal.repository';
import { AdoptionRepository } from '../../../infrastructure/database/mysql/repositories/adoption.repository';
import { S3Service } from '../../../infrastructure/services/aws/s3.service';
import { BusinessRuleValidationException, EntityNotFoundException } from '../../../core/exceptions/domain.exception';
import { AdoptionStatus } from '../../../core/domain/adoption/value-objects/adoption-status.enum';
import { In } from 'typeorm';

@Injectable()
export class DeleteAnimalUseCase {
  constructor(
    private readonly animalRepository: AnimalRepository,
    private readonly adoptionRepository: AdoptionRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(animalId: string): Promise<void> {
    try {
      const animal = await this.animalRepository.findById(animalId);
      
      const activeAdoptions = await this.adoptionRepository.findAll({
        animalId,
        status: In([AdoptionStatus.PENDING, AdoptionStatus.APPROVED]),
      });
      if (activeAdoptions.length > 0) {
        throw new BusinessRuleValidationException(
          'Cannot delete the animal because it has active adoption requests',
        );
      }
      
      const imageUrls = animal.getImages();
      
      const deletePromises = imageUrls.map(imageUrl => 
        this.s3Service.deleteFile(imageUrl).catch(error => {
          console.error(`Error deleting image ${imageUrl}: ${error.message}`);
        })
      );
      
      await Promise.all(deletePromises);
      
      await this.animalRepository.delete(animalId);
    } catch (error) {  
      if (
        error instanceof BusinessRuleValidationException ||
        error instanceof EntityNotFoundException
      ) {
        throw error;
      }
      throw new Error(`Error deleting animal: ${error.message}`);
    }
  }
}
