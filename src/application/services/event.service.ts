import { Injectable } from '@nestjs/common';

import { S3Service } from '../../infrastructure/services/aws/s3.service';
import { NotificationService } from '../../infrastructure/services/notification/notification.service';
import { EventRepository } from '../../infrastructure/database/mysql/repositories/event.repository';
import { OngRepository } from '../../infrastructure/database/mysql/repositories/ong.repository';


interface CreateEventDto {
  ongId: string;
  title: string;
  description: string;
  eventDate: Date;
  endDate?: Date;
  location: string;
  isVolunteerEvent: boolean;
  maxParticipants?: number;
  requirements?: string;
  image?: Express.Multer.File;
}

interface UpdateEventDto {
  title?: string;
  description?: string;
  eventDate?: Date;
  endDate?: Date;
  location?: string;
  isVolunteerEvent?: boolean;
  maxParticipants?: number;
  requirements?: string;
  active?: boolean;
  image?: Express.Multer.File;
}

@Injectable()
export class EventService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly ongRepository: OngRepository,
    private readonly s3Service: S3Service,
    private readonly notificationService: NotificationService,
  ) {}

  async createEvent(createEventDto: CreateEventDto) {
    let imageUrl: string | undefined;
    if (createEventDto.image) {
      imageUrl = await this.s3Service.uploadFile(
        createEventDto.image.buffer!,
        'events',
        createEventDto.image.originalname,
      );
    }
    
    const eventData = {
      ongId: createEventDto.ongId,
      title: createEventDto.title,
      description: createEventDto.description,
      eventDate: createEventDto.eventDate,
      endDate: createEventDto.endDate,
      location: createEventDto.location,
      imageUrl,
      active: true,
      isVolunteerEvent: createEventDto.isVolunteerEvent,
      maxParticipants: createEventDto.maxParticipants,
      requirements: createEventDto.requirements,
    };
    
    const event = await this.eventRepository.create(eventData);
    
    const ong = await this.ongRepository.findById(createEventDto.ongId);
    
    return event;
  }

  async getAllEvents(filters: any = {}) {
    return await this.eventRepository.findAll(filters);
  }

  async getEventById(eventId: string) {
    return await this.eventRepository.findById(eventId);
  }

  async getEventsByOng(ongId: string) {
    return await this.eventRepository.findByOngId(ongId);
  }

  async updateEvent(eventId: string, updateEventDto: UpdateEventDto) {
    const event = await this.eventRepository.findById(eventId);
    
    const updateData = { ...updateEventDto };
    
    if (updateEventDto.image) {
      const imageUrl = await this.s3Service.uploadFile(
        updateEventDto.image.buffer!,
        'events',
        updateEventDto.image.originalname,
      );
      
      if (event.imageUrl) {
        try {
          await this.s3Service.deleteFile(event.imageUrl);
        } catch (error) {
          console.error(`Error deleting previous image: ${error.message}`);
        }
      }
      
      updateData['imageUrl'] = imageUrl;
      delete updateData.image;
    }
    
    return await this.eventRepository.update(eventId, updateData);
  }

  async deleteEvent(eventId: string) {
    const event = await this.eventRepository.findById(eventId);
    
    if (event.imageUrl) {
      try {
        await this.s3Service.deleteFile(event.imageUrl);
      } catch (error) {
        console.error(`Error deleting image: ${error.message}`);
      }
    }
    
    await this.eventRepository.delete(eventId);
  }
}