import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OngEntity } from '../entities/ong.entity';
import { IOngRepository } from '../../../../core/interfaces/repositories/base-repository.interface';
import { EntityNotFoundException } from '../../../../core/exceptions/domain.exception';

@Injectable()
export class OngRepository implements IOngRepository {
  constructor(
    @InjectRepository(OngEntity)
    private readonly ongRepository: Repository<OngEntity>,
  ) {}

  async findAll(filters?: any): Promise<OngEntity[]> {
    return await this.ongRepository.find({
      where: filters,
      relations: ['user'],
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<OngEntity> {
    const ong = await this.ongRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!ong) {
      throw new EntityNotFoundException('ONG', id);
    }

    return ong;
  }

  async findOne(filters: any): Promise<OngEntity> {
    const ong = await this.ongRepository.findOne({
      where: filters,
      relations: ['user'],
    });

    if (!ong) {
      throw new EntityNotFoundException('ONG');
    }

    return ong;
  }

  async findVerified(): Promise<OngEntity[]> {
    return await this.ongRepository.find({
      where: { verified: true },
      relations: ['user'],
      order: { name: 'ASC' },
    });
  }

  async findByUserId(userId: string): Promise<OngEntity> {
    try {
      return await this.findOne({ userId });
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        throw new EntityNotFoundException('ONG para el usuario');
      }
      throw error;
    }
  }

  async create(entity: Partial<OngEntity>): Promise<OngEntity> {
    const ong = this.ongRepository.create(entity);
    const savedOng = await this.ongRepository.save(ong);
    
    return this.findById(savedOng.id);
  }

  async update(id: string, entity: Partial<OngEntity>): Promise<OngEntity> {
    await this.findById(id); // Validar que existe
    await this.ongRepository.update(id, entity);
    
    return this.findById(id);
  }

  async updateVerificationStatus(id: string, verified: boolean): Promise<void> {
    await this.findById(id); // Validar que existe
    await this.ongRepository.update(id, { verified });
  }

  async delete(id: string): Promise<void> {
    await this.findById(id); // Validar que existe
    await this.ongRepository.delete(id);
  }

  async exists(filters: any): Promise<boolean> {
    const count = await this.ongRepository.count({
      where: filters,
    });
    
    return count > 0;
  }
}