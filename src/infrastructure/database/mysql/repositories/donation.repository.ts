import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DonationEntity } from '../entities/donation.entity';
import { IDonationRepository } from '../../../../core/interfaces/repositories/base-repository.interface';
import { EntityNotFoundException } from '../../../../core/exceptions/domain.exception';
import { DonationStatus } from 'src/core/domain/donation/value-objects/donation-status.enum';

@Injectable()
export class DonationRepository implements IDonationRepository {
  constructor(
    @InjectRepository(DonationEntity)
    private readonly donationRepository: Repository<DonationEntity>,
  ) {}

  async findAll(filters?: any): Promise<DonationEntity[]> {
    return await this.donationRepository.find({
      where: filters,
      relations: ['donor', 'ong', 'items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<DonationEntity> {
    const donation = await this.donationRepository.findOne({
      where: { id },
      relations: ['donor', 'ong', 'items'],
    });

    if (!donation) {
      throw new EntityNotFoundException('Donación', id);
    }

    return donation;
  }

  async findOne(filters: any): Promise<DonationEntity> {
    const donation = await this.donationRepository.findOne({
      where: filters,
      relations: ['donor', 'ong', 'items'],
    });

    if (!donation) {
      throw new EntityNotFoundException('Donación');
    }

    return donation;
  }

  async findByDonorId(donorId: string): Promise<DonationEntity[]> {
    return await this.donationRepository.find({
      where: { donorId },
      relations: ['donor', 'ong', 'items'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByOngId(ongId: string): Promise<DonationEntity[]> {
    return await this.donationRepository.find({
      where: { ongId },
      relations: ['donor', 'ong', 'items'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(entity: Partial<DonationEntity>): Promise<DonationEntity> {
    const donation = this.donationRepository.create(entity);
    const savedDonation = await this.donationRepository.save(donation);
    
    return this.findById(savedDonation.id);
  }

  async update(id: string, entity: Partial<DonationEntity>): Promise<DonationEntity> {
    await this.findById(id); // Validar que existe
    await this.donationRepository.update(id, entity);
    
    return this.findById(id);
  }

  async updateConfirmationStatus(id: string, confirmed: boolean): Promise<void> {
    // Obtener la entidad actual
    const donation = await this.donationRepository.findOne({ where: { id } });
    
    if (!donation) {
      throw new EntityNotFoundException('Donación', id);
    }
    
    // Actualizar propiedades
    if (confirmed) {
      donation.status = DonationStatus.CONFIRMED;
      donation.confirmationDate = new Date();
    } else {
      donation.status = DonationStatus.PENDING;
      donation.confirmationDate = null;
    }
    
    // Guardar la entidad
    await this.donationRepository.save(donation);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id); // Validar que existe
    await this.donationRepository.delete(id);
  }

  async exists(filters: any): Promise<boolean> {
    const count = await this.donationRepository.count({
      where: filters,
    });
    
    return count > 0;
  }
}