import { Injectable } from '@nestjs/common';
import { AnimalEntity } from '../../../core/domain/animal/animal.entity';
import { AnimalRepository } from '../../../infrastructure/database/mysql/repositories/animal.repository';
import { AnimalType } from '../../../core/domain/animal/value-objects/animal-type.enum';
import { AnimalGender } from '../../../core/domain/animal/value-objects/animal-gender.enum';

interface GetAnimalsFilters {
  ownerId?: string;
  type?: AnimalType;
  breed?: string;
  gender?: AnimalGender;
  availableForAdoption?: boolean;
  minAge?: number;
  maxAge?: number;
}

@Injectable()
export class GetAnimalsUseCase {
  constructor(
    private readonly animalRepository: AnimalRepository,
  ) {}

  async execute(filters?: GetAnimalsFilters): Promise<AnimalEntity[]> {
    try {
      // Preparar filtros avanzados si es necesario
      let processedFilters: any = { ...filters };
      
      // Filtrar por rango de edad si se especifica
      if (filters?.minAge !== undefined || filters?.maxAge !== undefined) {
        processedFilters.age = {};
        
        if (filters.minAge !== undefined) {
          processedFilters.age = { $gte: filters.minAge };
        }
        
        if (filters.maxAge !== undefined) {
          processedFilters.age = { ...processedFilters.age, $lte: filters.maxAge };
        }
        
        // Eliminar los filtros originales
        delete processedFilters.minAge;
        delete processedFilters.maxAge;
      }
      
      return await this.animalRepository.findAll(processedFilters);
    } catch (error) {
      throw new Error(`Error al obtener mascotas: ${error.message}`);
    }
  }
}