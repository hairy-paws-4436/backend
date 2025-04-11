import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../infrastructure/database/mysql/repositories/user.repository';

import { NotificationService } from '../../infrastructure/services/notification/notification.service';
import { NotificationType } from '../../core/domain/notification/value-objects/notification-type.enum';
import { UserRole } from '../../core/domain/user/value-objects/user-role.enum';

import { UserStatus } from 'src/core/domain/user/value-objects/user-status';
import { OngRepository } from 'src/infrastructure/database/mysql/repositories/ong.repository';


@Injectable()
export class AdminService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly ongRepository: OngRepository,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Obtiene todos los usuarios con filtros opcionales
   * @param role Filtrar por rol
   * @param verified Filtrar por estado de verificación
   * @param status Filtrar por estado
   * @returns Lista de usuarios
   */
  async getAllUsers(role?: UserRole, verified?: boolean, status?: UserStatus) {
    const filters = {
      ...(role && { role }),
      ...(verified !== undefined && { verified }),
      ...(status && { status }),
    };
    
    return await this.userRepository.findAll(filters);
  }

  /**
   * Obtiene todas las ONGs con filtros opcionales
   * @param verified Filtrar por estado de verificación
   * @returns Lista de ONGs
   */
  async getAllOngs(verified?: boolean) {
    const filters = {
      ...(verified !== undefined && { verified }),
    };
    
    return await this.ongRepository.findAll(filters);
  }

  /**
   * Verifica un usuario
   * @param userId ID del usuario
   * @param notes Notas sobre la verificación
   */
  async verifyUser(userId: string, notes?: string) {
    // Buscar usuario
    const user = await this.userRepository.findById(userId);
    
    // Verificar usuario
    user.verify();
    await this.userRepository.update(userId, user);
    
    // Enviar notificación
    await this.notificationService.create({
      userId,
      type: NotificationType.ACCOUNT_VERIFIED,
      title: 'Cuenta verificada',
      message: 'Tu cuenta ha sido verificada por un administrador.',
    });
  }

  /**
   * Verifica una ONG
   * @param ongId ID de la ONG
   * @param notes Notas sobre la verificación
   */
  async verifyOng(ongId: string, notes?: string) {
    // Verificar ONG
    await this.ongRepository.updateVerificationStatus(ongId, true);
    
    // Obtener usuario asociado
    const ong = await this.ongRepository.findById(ongId);
    
    // Verificar usuario asociado
    const user = await this.userRepository.findById(ong.userId);
    user.verify();
    await this.userRepository.update(user.getId(), user);
    
    // Enviar notificación
    await this.notificationService.create({
      userId: ong.userId,
      type: NotificationType.ACCOUNT_VERIFIED,
      title: 'ONG verificada',
      message: 'Tu organización ha sido verificada por un administrador.',
    });
  }

  /**
   * Cambia el estado de un usuario
   * @param userId ID del usuario
   * @param status Nuevo estado
   */
  async changeUserStatus(userId: string, status: UserStatus) {
    const user = await this.userRepository.findById(userId);
    
    if (status === UserStatus.ACTIVE) {
      user.activate();
    } else if (status === UserStatus.INACTIVE) {
      user.deactivate();
    } else {
      // Para otros estados como SUSPENDED, se podría implementar métodos específicos
      // user.suspend();
    }
    
    await this.userRepository.update(userId, user);
  }

  /**
   * Elimina un usuario
   * @param userId ID del usuario
   */
  async deleteUser(userId: string) {
    await this.userRepository.delete(userId);
  }
}