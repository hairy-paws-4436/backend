import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdoptionEntity as AdoptionOrmEntity } from '../entities/adoption.entity';
import { AdoptionEntity as AdoptionDomainEntity } from '../../../../core/domain/adoption/adoption.entity';
import { IAdoptionRepository } from '../../../../core/interfaces/repositories/base-repository.interface';
import { EntityNotFoundException } from '../../../../core/exceptions/domain.exception';
import { AdoptionType } from '../../../../core/domain/adoption/value-objects/adoption-type.enum';
import { AdoptionStatus } from '../../../../core/domain/adoption/value-objects/adoption-status.enum';

@Injectable()
export class AdoptionRepository implements IAdoptionRepository {
  constructor(
    @InjectRepository(AdoptionOrmEntity)
    private readonly adoptionRepository: Repository<AdoptionOrmEntity>,
  ) {}

  async findAll(filters?: any): Promise<AdoptionDomainEntity[]> {
    const adoptions = await this.adoptionRepository.find({
      where: filters,
      relations: ['animal', 'owner', 'adopter'],
      order: { createdAt: 'DESC' },
    });

    return adoptions.map(adoption => this.toDomainEntity(adoption));
  }

  async findById(id: string): Promise<AdoptionDomainEntity> {
    const adoption = await this.adoptionRepository.findOne({
      where: { id },
      relations: ['animal', 'owner', 'adopter'],
    });

    if (!adoption) {
      throw new EntityNotFoundException('Solicitud de adopción', id);
    }

    return this.toDomainEntity(adoption);
  }

  async findOne(filters: any): Promise<AdoptionDomainEntity> {
    const adoption = await this.adoptionRepository.findOne({
      where: filters,
      relations: ['animal', 'owner', 'adopter'],
    });

    if (!adoption) {
      throw new EntityNotFoundException('Solicitud de adopción');
    }

    return this.toDomainEntity(adoption);
  }

  async findByAnimalId(animalId: string): Promise<AdoptionDomainEntity[]> {
    const adoptions = await this.adoptionRepository.find({
      where: { animalId },
      relations: ['animal', 'owner', 'adopter'],
      order: { createdAt: 'DESC' },
    });

    return adoptions.map(adoption => this.toDomainEntity(adoption));
  }

  async findByAdopterId(adopterId: string): Promise<AdoptionDomainEntity[]> {
    const adoptions = await this.adoptionRepository.find({
      where: { adopterId },
      relations: ['animal', 'owner', 'adopter'],
      order: { createdAt: 'DESC' },
    });

    return adoptions.map(adoption => this.toDomainEntity(adoption));
  }

  async findByOwnerId(ownerId: string): Promise<AdoptionDomainEntity[]> {
    const adoptions = await this.adoptionRepository.find({
      where: { ownerId },
      relations: ['animal', 'owner', 'adopter'],
      order: { createdAt: 'DESC' },
    });

    return adoptions.map(adoption => this.toDomainEntity(adoption));
  }

  async create(entity: AdoptionDomainEntity): Promise<AdoptionDomainEntity> {
    const adoptionData = this.toOrmEntity(entity);
    const createdAdoption = await this.adoptionRepository.save(adoptionData);
    
    return this.findById(createdAdoption.id);
  }

  async update(id: string, entity: Partial<AdoptionDomainEntity>): Promise<AdoptionDomainEntity> {
    const adoption = await this.findById(id);
    const adoptionData = this.toOrmEntity(entity as AdoptionDomainEntity);
    
    await this.adoptionRepository.update(id, adoptionData);
    
    return this.findById(id);
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.adoptionRepository.update(id, {
      status: status as AdoptionStatus,
    });
  }

  async delete(id: string): Promise<void> {
    const adoption = await this.findById(id);
    await this.adoptionRepository.delete(id);
  }

  async exists(filters: any): Promise<boolean> {
    const count = await this.adoptionRepository.count({
      where: filters,
    });
    
    return count > 0;
  }

  // Métodos de mapeo entre entidades de dominio y ORM
  private toDomainEntity(ormEntity: AdoptionOrmEntity): AdoptionDomainEntity {
    return new AdoptionDomainEntity(
      ormEntity.id,
      ormEntity.animalId,
      ormEntity.ownerId,
      ormEntity.adopterId,
      ormEntity.type as AdoptionType,
      ormEntity.status as AdoptionStatus,
      ormEntity.requestDate,
      ormEntity.approvalDate,
      ormEntity.rejectionDate,
      ormEntity.visitDate,
      ormEntity.notes,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  private toOrmEntity(domainEntity: AdoptionDomainEntity): Partial<AdoptionOrmEntity> {
    const entityData = domainEntity.toObject();
    
    return {
      id: entityData.id,
      animalId: entityData.animalId,
      ownerId: entityData.ownerId,
      adopterId: entityData.adopterId,
      type: entityData.type,
      status: entityData.status,
      requestDate: entityData.requestDate,
      approvalDate: entityData.approvalDate,
      rejectionDate: entityData.rejectionDate,
      visitDate: entityData.visitDate,
      notes: entityData.notes,
    };
  }
}