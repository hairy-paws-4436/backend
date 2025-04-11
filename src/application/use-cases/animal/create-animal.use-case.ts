import { Injectable } from '@nestjs/common';
import { AnimalEntity } from '../../../core/domain/animal/animal.entity';
import { AnimalRepository } from '../../../infrastructure/database/mysql/repositories/animal.repository';
import { S3Service } from '../../../infrastructure/services/aws/s3.service';
import { AnimalType } from '../../../core/domain/animal/value-objects/animal-type.enum';
import { AnimalGender } from '../../../core/domain/animal/value-objects/animal-gender.enum';
import { BusinessRuleValidationException } from '../../../core/exceptions/domain.exception';

interface CreateAnimalDto {
  name: string;
  type: AnimalType;
  breed: string;
  age: number;
  gender: AnimalGender;
  description: string;
  ownerId: string;
  weight?: number;
  healthDetails?: string;
  vaccinated: boolean;
  sterilized: boolean;
  images?: Express.Multer.File[];
}

@Injectable()
export class CreateAnimalUseCase {
  constructor(
    private readonly animalRepository: AnimalRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(createAnimalDto: CreateAnimalDto): Promise<AnimalEntity> {
    try {
      // Procesar y subir imágenes si existen
      let imageUrls: string[] = [];
      if (createAnimalDto.images && createAnimalDto.images.length > 0) {
        const imageBuffers = createAnimalDto.images.map(file => file.buffer);
        const originalNames = createAnimalDto.images.map(file => file.originalname);
        imageUrls = await this.s3Service.uploadMultipleFiles(
          imageBuffers,
          'animals',
          originalNames,
        );
      }

      // Crear entidad de dominio
      const animalEntity = new AnimalEntity(
        null, // ID será generado
        createAnimalDto.name,
        createAnimalDto.type,
        createAnimalDto.breed,
        createAnimalDto.age,
        createAnimalDto.gender,
        createAnimalDto.description,
        createAnimalDto.ownerId,
        imageUrls,
        undefined, // estado por defecto
        true, // disponible para adopción por defecto
        createAnimalDto.weight,
        createAnimalDto.healthDetails,
        createAnimalDto.vaccinated,
        createAnimalDto.sterilized
      );

      // Guardar en el repositorio
      return await this.animalRepository.create(animalEntity);
    } catch (error) {
      // Si ocurre un error y ya se subieron imágenes, eliminarlas
      if (error instanceof BusinessRuleValidationException) {
        throw error;
      }
      throw new Error(`Error al crear animal: ${error.message}`);
    }
  }
}