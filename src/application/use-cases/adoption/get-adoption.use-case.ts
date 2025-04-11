import { Injectable } from '@nestjs/common';
import { AdoptionEntity } from '../../../core/domain/adoption/adoption.entity';
import { AdoptionRepository } from '../../../infrastructure/database/mysql/repositories/adoption.repository';
import { EntityNotFoundException } from '../../../core/exceptions/domain.exception';

@Injectable()
export class GetAdoptionUseCase {
  constructor(
    private readonly adoptionRepository: AdoptionRepository,
  ) {}

  async execute(adoptionId: string): Promise<AdoptionEntity> {
    try {
      return await this.adoptionRepository.findById(adoptionId);
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        throw error;
      }
      throw new Error(`Error al obtener solicitud de adopción: ${error.message}`);
    }
  }
}