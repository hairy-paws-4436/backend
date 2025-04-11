import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IBaseRepository } from '../../../../core/interfaces/repositories/base-repository.interface';
import { EntityNotFoundException } from '../../../../core/exceptions/domain.exception';
import { DonationItemEntity } from '../entities/donation-items.entity';

@Injectable()
export class DonationItemRepository implements IBaseRepository<DonationItemEntity> {
  constructor(
    @InjectRepository(DonationItemEntity)
    private readonly donationItemRepository: Repository<DonationItemEntity>,
  ) {}

  async findAll(filters?: any): Promise<DonationItemEntity[]> {
    return await this.donationItemRepository.find({
      where: filters,
      relations: ['donation'],
    });
  }

  async findById(id: string): Promise<DonationItemEntity> {
    const donationItem = await this.donationItemRepository.findOne({
      where: { id },
      relations: ['donation'],
    });

    if (!donationItem) {
      throw new EntityNotFoundException('Ítem de donación', id);
    }

    return donationItem;
  }

  async findOne(filters: any): Promise<DonationItemEntity> {
    const donationItem = await this.donationItemRepository.findOne({
      where: filters,
      relations: ['donation'],
    });

    if (!donationItem) {
      throw new EntityNotFoundException('Ítem de donación');
    }

    return donationItem;
  }

  async findByDonationId(donationId: string): Promise<DonationItemEntity[]> {
    return await this.donationItemRepository.find({
      where: { donationId },
    });
  }

  async create(entity: Partial<DonationItemEntity>): Promise<DonationItemEntity> {
    const donationItem = this.donationItemRepository.create(entity);
    const savedDonationItem = await this.donationItemRepository.save(donationItem);
    
    return this.findById(savedDonationItem.id);
  }

  async createMany(entities: Partial<DonationItemEntity>[]): Promise<DonationItemEntity[]> {
    const donationItems = this.donationItemRepository.create(entities);
    const savedDonationItems = await this.donationItemRepository.save(donationItems);
    
    return savedDonationItems;
  }

  async update(id: string, entity: Partial<DonationItemEntity>): Promise<DonationItemEntity> {
    await this.findById(id); // Validar que existe
    await this.donationItemRepository.update(id, entity);
    
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id); // Validar que existe
    await this.donationItemRepository.delete(id);
  }

  async deleteByDonationId(donationId: string): Promise<void> {
    await this.donationItemRepository.delete({ donationId });
  }

  async exists(filters: any): Promise<boolean> {
    const count = await this.donationItemRepository.count({
      where: filters,
    });
    
    return count > 0;
  }
}