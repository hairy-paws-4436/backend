import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from '../../database/mysql/entities/notification.entity';
import { NotificationType } from '../../../core/domain/notification/value-objects/notification-type.enum';

interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  referenceId?: string;
  referenceType?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
  ) {}

  /**
   * Crear una nueva notificación
   * @param dto Datos de la notificación
   * @returns Notificación creada
   */
  async create(dto: CreateNotificationDto): Promise<NotificationEntity> {
    try {
      const notification = this.notificationRepository.create({
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        read: false,
        referenceId: dto.referenceId,
        referenceType: dto.referenceType,
      });
      
      return await this.notificationRepository.save(notification);
    } catch (error) {
      this.logger.error(`Error al crear notificación: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener notificaciones de un usuario
   * @param userId ID del usuario
   * @param unreadOnly Solo obtener notificaciones no leídas
   * @returns Lista de notificaciones
   */
  async getByUserId(userId: string, unreadOnly: boolean = false): Promise<NotificationEntity[]> {
    try {
      return await this.notificationRepository.find({
        where: {
          userId,
          ...(unreadOnly && { read: false }),
        },
        order: {
          createdAt: 'DESC',
        },
      });
    } catch (error) {
      this.logger.error(`Error al obtener notificaciones: ${error.message}`);
      throw error;
    }
  }

  /**
   * Marcar una notificación como leída
   * @param id ID de la notificación
   * @param userId ID del usuario (para verificar propiedad)
   */
  async markAsRead(id: string, userId: string): Promise<void> {
    try {
      // Verificar que la notificación existe y pertenece al usuario
      const notification = await this.notificationRepository.findOne({
        where: { id, userId },
      });
      
      if (!notification) {
        throw new Error('Notificación no encontrada o no pertenece al usuario');
      }
      
      // Marcar como leída
      await this.notificationRepository.update(id, { read: true });
    } catch (error) {
      this.logger.error(`Error al marcar notificación como leída: ${error.message}`);
      throw error;
    }
  }

  /**
   * Marcar todas las notificaciones de un usuario como leídas
   * @param userId ID del usuario
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await this.notificationRepository.update(
        { userId, read: false },
        { read: true },
      );
    } catch (error) {
      this.logger.error(`Error al marcar todas las notificaciones como leídas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Eliminar una notificación
   * @param id ID de la notificación
   * @param userId ID del usuario (para verificar propiedad)
   */
  async delete(id: string, userId: string): Promise<void> {
    try {
      // Verificar que la notificación existe y pertenece al usuario
      const notification = await this.notificationRepository.findOne({
        where: { id, userId },
      });
      
      if (!notification) {
        throw new Error('Notificación no encontrada o no pertenece al usuario');
      }
      
      // Eliminar la notificación
      await this.notificationRepository.delete(id);
    } catch (error) {
      this.logger.error(`Error al eliminar notificación: ${error.message}`);
      throw error;
    }
  }

  /**
   * Enviar notificación a múltiples usuarios
   * @param userIds IDs de los usuarios
   * @param type Tipo de notificación
   * @param title Título de la notificación
   * @param message Mensaje de la notificación
   * @param referenceId ID de referencia (opcional)
   * @param referenceType Tipo de referencia (opcional)
   */
  async sendToMultipleUsers(
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    referenceId?: string,
    referenceType?: string,
  ): Promise<void> {
    try {
      const notifications = userIds.map(userId => ({
        userId,
        type,
        title,
        message,
        read: false,
        referenceId,
        referenceType,
      }));
      
      await this.notificationRepository.save(notifications);
    } catch (error) {
      this.logger.error(`Error al enviar notificaciones a múltiples usuarios: ${error.message}`);
      throw error;
    }
  }
}