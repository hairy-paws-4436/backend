import { Injectable } from '@nestjs/common';

import { S3Service } from '../../infrastructure/services/aws/s3.service';
import { NotificationService } from '../../infrastructure/services/notification/notification.service';
import { EventRepository } from 'src/infrastructure/database/mysql/repositories/event.repository';
import { OngRepository } from 'src/infrastructure/database/mysql/repositories/ong.repository';


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

  /**
   * Crea un nuevo evento
   * @param createEventDto Datos para crear el evento
   * @returns Evento creado
   */
  async createEvent(createEventDto: CreateEventDto) {
    // Subir imagen si se proporciona
    let imageUrl: string | undefined;
    if (createEventDto.image) {
      imageUrl = await this.s3Service.uploadFile(
        createEventDto.image.buffer,
        'events',
        createEventDto.image.originalname,
      );
    }
    
    // Crear evento
    const eventData = {
      ongId: createEventDto.ongId,
      title: createEventDto.title,
      description: createEventDto.description,
      eventDate: createEventDto.eventDate,
      endDate: createEventDto.endDate,
      location: createEventDto.location,
      imageUrl,
      active: true, // Por defecto activo
      isVolunteerEvent: createEventDto.isVolunteerEvent,
      maxParticipants: createEventDto.maxParticipants,
      requirements: createEventDto.requirements,
    };
    
    const event = await this.eventRepository.create(eventData);
    
    // Obtener información de la ONG
    const ong = await this.ongRepository.findById(createEventDto.ongId);
    
    // Notificar a los interesados (podría implementarse un sistema de suscripciones o seguimiento de ONGs)
    // Por ahora, este es un placeholder para la funcionalidad futura
    
    return event;
  }

  /**
   * Obtiene todos los eventos
   * @param filters Filtros opcionales
   * @returns Lista de eventos
   */
  async getAllEvents(filters: any = {}) {
    return await this.eventRepository.findAll(filters);
  }

  /**
   * Obtiene un evento por su ID
   * @param eventId ID del evento
   * @returns Datos del evento
   */
  async getEventById(eventId: string) {
    return await this.eventRepository.findById(eventId);
  }

  /**
   * Obtiene eventos por ONG
   * @param ongId ID de la ONG
   * @returns Lista de eventos
   */
  async getEventsByOng(ongId: string) {
    return await this.eventRepository.findByOngId(ongId);
  }

  /**
   * Actualiza un evento
   * @param eventId ID del evento
   * @param updateEventDto Datos a actualizar
   * @returns Evento actualizado
   */
  async updateEvent(eventId: string, updateEventDto: UpdateEventDto) {
    // Verificar si el evento existe
    const event = await this.eventRepository.findById(eventId);
    
    // Preparar datos a actualizar
    const updateData = { ...updateEventDto };
    
    // Procesar imagen si se proporciona
    if (updateEventDto.image) {
      const imageUrl = await this.s3Service.uploadFile(
        updateEventDto.image.buffer,
        'events',
        updateEventDto.image.originalname,
      );
      
      // Eliminar imagen anterior si existe
      if (event.imageUrl) {
        try {
          await this.s3Service.deleteFile(event.imageUrl);
        } catch (error) {
          console.error(`Error al eliminar imagen anterior: ${error.message}`);
        }
      }
      
      updateData['imageUrl'] = imageUrl;
      delete updateData.image;
    }
    
    // Actualizar evento
    return await this.eventRepository.update(eventId, updateData);
  }

  /**
   * Elimina un evento
   * @param eventId ID del evento
   */
  async deleteEvent(eventId: string) {
    // Verificar si el evento existe
    const event = await this.eventRepository.findById(eventId);
    
    // Eliminar imagen si existe
    if (event.imageUrl) {
      try {
        await this.s3Service.deleteFile(event.imageUrl);
      } catch (error) {
        console.error(`Error al eliminar imagen: ${error.message}`);
      }
    }
    
    // Eliminar evento
    await this.eventRepository.delete(eventId);
  }
}