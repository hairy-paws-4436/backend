import { Injectable } from '@nestjs/common';
import { AnimalEntity } from '../../../core/domain/animal/animal.entity';
import { AnimalRepository } from '../../../infrastructure/database/mysql/repositories/animal.repository';
import { S3Service } from '../../../infrastructure/services/aws/s3.service';
import { AnimalType } from '../../../core/domain/animal/value-objects/animal-type.enum';
import { AnimalGender } from '../../../core/domain/animal/value-objects/animal-gender.enum';
import { BusinessRuleValidationException } from '../../../core/exceptions/domain.exception';

interface UpdateAnimalDto {
  name?: string;
  type?: AnimalType;
  breed?: string;
  age?: number;
  gender?: AnimalGender;
  description?: string;
  weight?: number;
  healthDetails?: string;
  vaccinated?: boolean;
  sterilized?: boolean;
  availableForAdoption?: boolean;
  images?: Express.Multer.File[];
  removeCurrentImages?: boolean;
}

@Injectable()
export class UpdateAnimalUseCase {
  constructor(
    private readonly animalRepository: AnimalRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(animalId: string, updateAnimalDto: UpdateAnimalDto): Promise<AnimalEntity> {
    try {
      // Obtener la mascota actual
      const animal = await this.animalRepository.findById(animalId);
      
      // Actualizar campos básicos
      animal.updateInfo(
        updateAnimalDto.name,
        updateAnimalDto.type,
        updateAnimalDto.breed,
        updateAnimalDto.age,
        updateAnimalDto.gender,
        updateAnimalDto.description,
        updateAnimalDto.weight,
        updateAnimalDto.healthDetails,
        updateAnimalDto.vaccinated,
        updateAnimalDto.sterilized,
      );
      
      // Actualizar disponibilidad para adopción
      if (updateAnimalDto.availableForAdoption !== undefined) {
        if (updateAnimalDto.availableForAdoption) {
          animal.makeAvailableForAdoption();
        } else {
          animal.makeUnavailableForAdoption();
        }
      }
      
      // Gestionar imágenes si es necesario
      let newImageUrls: string[] = [...animal.getImages()];
      
      // Si se indica eliminar imágenes actuales
      if (updateAnimalDto.removeCurrentImages) {
        // Eliminar imágenes actuales de S3
        const currentImages = animal.getImages();
        
        const deletePromises = currentImages.map(imageUrl => 
          this.s3Service.deleteFile(imageUrl).catch(error => {
            console.error(`Error al eliminar imagen ${imageUrl}: ${error.message}`);
            // No interrumpir el proceso si falla la eliminación de una imagen
          })
        );
        
        await Promise.all(deletePromises);
        
        // Vaciar el array de imágenes
        newImageUrls = [];
      }
      
      // Si hay nuevas imágenes, subirlas
      if (updateAnimalDto.images && updateAnimalDto.images.length > 0) {
        const imageBuffers = updateAnimalDto.images.map(file => file.buffer);
        const originalNames = updateAnimalDto.images.map(file => file.originalname);
        
        const uploadedImageUrls = await this.s3Service.uploadMultipleFiles(
          imageBuffers,
          'animals',
          originalNames,
        );
        
        // Agregar las nuevas URLs al array
        newImageUrls = [...newImageUrls, ...uploadedImageUrls];
      }
      
      // Actualizar las imágenes en la entidad
      animal.setImages(newImageUrls);
      
      // Guardar los cambios
      return await this.animalRepository.update(animalId, animal);
    } catch (error) {
      if (error instanceof BusinessRuleValidationException) {
        throw error;
      }
      throw new Error(`Error al actualizar mascota: ${error.message}`);
    }
  }
}