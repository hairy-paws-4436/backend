import { Injectable } from '@nestjs/common';
import { AdoptionEntity } from '../../../core/domain/adoption/adoption.entity';

import { AnimalRepository } from '../../../infrastructure/database/mysql/repositories/animal.repository';
import { NotificationService } from '../../../infrastructure/services/notification/notification.service';
import { AdoptionType } from '../../../core/domain/adoption/value-objects/adoption-type.enum';
import { NotificationType } from '../../../core/domain/notification/value-objects/notification-type.enum';
import { BusinessRuleValidationException, EntityNotFoundException } from '../../../core/exceptions/domain.exception';
import { AdoptionRepository } from 'src/infrastructure/database/mysql/repositories/adoption.repository';

interface RequestAdoptionDto {
  animalId: string;
  adopterId: string;
  type: AdoptionType;
  visitDate?: Date;
  notes?: string;
}

@Injectable()
export class RequestAdoptionUseCase {
  constructor(
    private readonly adoptionRepository: AdoptionRepository,
    private readonly animalRepository: AnimalRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async execute(requestAdoptionDto: RequestAdoptionDto): Promise<AdoptionEntity> {
    try {
      // Obtener información del animal
      const animal = await this.animalRepository.findById(requestAdoptionDto.animalId);
      
      // Verificar si el animal está disponible para adopción
      if (!animal.canBeAdopted()) {
        throw new BusinessRuleValidationException(
          'Esta mascota no está disponible para adopción en este momento',
        );
      }
      
      // Verificar que el adoptante no sea el dueño
      if (animal.getOwnerId() === requestAdoptionDto.adopterId) {
        throw new BusinessRuleValidationException(
          'No puedes solicitar adoptar tu propia mascota',
        );
      }
      
      // Verificar que no haya una solicitud pendiente del mismo adoptante para el mismo animal
      const existingRequest = await this.adoptionRepository.exists({
        animalId: requestAdoptionDto.animalId,
        adopterId: requestAdoptionDto.adopterId,
        status: 'pending',
      });
      
      if (existingRequest) {
        throw new BusinessRuleValidationException(
          'Ya tienes una solicitud pendiente para esta mascota',
        );
      }
      
      // Verificar la fecha de visita si es una solicitud de visita
      if (requestAdoptionDto.type === AdoptionType.VISIT && !requestAdoptionDto.visitDate) {
        throw new BusinessRuleValidationException(
          'Debes proporcionar una fecha de visita',
        );
      }
      
      // Crear entidad de adopción
      const adoptionEntity = new AdoptionEntity(
        null, // ID será generado
        requestAdoptionDto.animalId,
        animal.getOwnerId(),
        requestAdoptionDto.adopterId,
        requestAdoptionDto.type,
        undefined, // estado pendiente por defecto
        new Date(), // fecha de solicitud actual
        undefined, // fecha de aprobación
        undefined, // fecha de rechazo
        requestAdoptionDto.visitDate, // fecha de visita (para solicitudes de visita)
        requestAdoptionDto.notes, // notas opcionales
      );
      
      // Guardar en el repositorio
      const createdAdoption = await this.adoptionRepository.create(adoptionEntity);
      
      // Enviar notificación al dueño
      const notificationType = requestAdoptionDto.type === AdoptionType.ADOPTION
        ? NotificationType.ADOPTION_REQUEST
        : NotificationType.VISIT_REQUEST;
      
      const notificationTitle = requestAdoptionDto.type === AdoptionType.ADOPTION
        ? 'Nueva solicitud de adopción'
        : 'Nueva solicitud de visita';
      
      const notificationMessage = requestAdoptionDto.type === AdoptionType.ADOPTION
        ? `Has recibido una solicitud para adoptar a ${animal.getName()}`
        : `Has recibido una solicitud para visitar a ${animal.getName()}`;
      
      await this.notificationService.create({
        userId: animal.getOwnerId(),
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        referenceId: createdAdoption.getId(),
        referenceType: 'adoption',
      });
      
      return createdAdoption;
    } catch (error) {
      if (
        error instanceof BusinessRuleValidationException ||
        error instanceof EntityNotFoundException
      ) {
        throw error;
      }
      throw new Error(`Error al solicitar adopción: ${error.message}`);
    }
  }
}