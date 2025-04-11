import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { EventEntity } from '../entities/event.entity';
import { IBaseRepository } from '../../../../core/interfaces/repositories/base-repository.interface';
import { EntityNotFoundException } from '../../../../core/exceptions/domain.exception';

@Injectable()
export class EventRepository implements IBaseRepository<EventEntity> {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventRepository: Repository<EventEntity>,
  ) {}

  async findAll(filters?: any): Promise<EventEntity[]> {
    return await this.eventRepository.find({
      where: filters,
      relations: ['ong'],
      order: { eventDate: 'ASC' },
    });
  }

  async findById(id: string): Promise<EventEntity> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['ong'],
    });

    if (!event) {
      throw new EntityNotFoundException('Evento', id);
    }

    return event;
  }

  async findOne(filters: any): Promise<EventEntity> {
    const event = await this.eventRepository.findOne({
      where: filters,
      relations: ['ong'],
    });

    if (!event) {
      throw new EntityNotFoundException('Evento');
    }

    return event;
  }

  async findByOngId(ongId: string): Promise<EventEntity[]> {
    return await this.eventRepository.find({
      where: { ongId },
      order: { eventDate: 'ASC' },
    });
  }

  async findActive(): Promise<EventEntity[]> {
    const now = new Date();
    
    return await this.eventRepository.find({
      where: {
        active: true,
        eventDate: MoreThanOrEqual(now),
      },
      order: { eventDate: 'ASC' },
    });
  }

  async create(entity: Partial<EventEntity>): Promise<EventEntity> {
    const event = this.eventRepository.create(entity);
    const savedEvent = await this.eventRepository.save(event);
    
    return this.findById(savedEvent.id);
  }

  async update(id: string, entity: Partial<EventEntity>): Promise<EventEntity> {
    await this.findById(id); // Validar que existe
    await this.eventRepository.update(id, entity);
    
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id); // Validar que existe
    await this.eventRepository.delete(id);
  }

  async exists(filters: any): Promise<boolean> {
    const count = await this.eventRepository.count({
      where: filters,
    });
    
    return count > 0;
  }
}