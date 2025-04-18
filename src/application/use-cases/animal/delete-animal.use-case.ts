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
      // Verificar si existe la mascota
      const animal = await this.animalRepository.findById(animalId);
      
      // Verificar si tiene adopciones en curso
      const activeAdoptions = await this.adoptionRepository.findAll({
        animalId,
        status: In([AdoptionStatus.PENDING, AdoptionStatus.APPROVED]),
      });
      if (activeAdoptions.length > 0) {
        throw new BusinessRuleValidationException(
          'No se puede eliminar la mascota porque tiene solicitudes de adopción activas',
        );
      }
      
      // Eliminar imágenes de S3
      const imageUrls = animal.getImages();
      
      const deletePromises = imageUrls.map(imageUrl => 
        this.s3Service.deleteFile(imageUrl).catch(error => {
          console.error(`Error al eliminar imagen ${imageUrl}: ${error.message}`);
          // No interrumpir el proceso si falla la eliminación de una imagen
        })
      );
      
      await Promise.all(deletePromises);
      
      // Eliminar la mascota
      await this.animalRepository.delete(animalId);
    } catch (error) {  
      if (
        error instanceof BusinessRuleValidationException ||
        error instanceof EntityNotFoundException
      ) {
        throw error;
      }
      throw new Error(`Error al eliminar mascota: ${error.message}`);
    }
  }
}

