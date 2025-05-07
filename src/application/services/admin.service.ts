import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../infrastructure/database/mysql/repositories/user.repository';

import { NotificationService } from '../../infrastructure/services/notification/notification.service';
import { NotificationType } from '../../core/domain/notification/value-objects/notification-type.enum';
import { UserRole } from '../../core/domain/user/value-objects/user-role.enum';
import { UserStatus } from '../../core/domain/user/value-objects/user-status';
import { OngRepository } from '../../infrastructure/database/mysql/repositories/ong.repository';


@Injectable()
export class AdminService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly ongRepository: OngRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async getAllUsers(role?: UserRole, verified?: boolean, status?: UserStatus) {
    const filters = {
      ...(role && { role }),
      ...(verified !== undefined && { verified }),
      ...(status && { status }),
    };
    
    return await this.userRepository.findAll(filters);
  }

  async getAllOngs(verified?: boolean) {
    const filters = {
      ...(verified !== undefined && { verified }),
    };
    
    return await this.ongRepository.findAll(filters);
  }

  async verifyUser(userId: string, notes?: string) {
    const user = await this.userRepository.findById(userId);
    user.verify();
    await this.userRepository.update(userId, user);
    await this.notificationService.create({
      userId,
      type: NotificationType.ACCOUNT_VERIFIED,
      title: 'Account Verified',
      message: 'Your account has been verified by an administrator.',
    });    
  }

  async verifyOng(ongId: string, notes?: string) {
    await this.ongRepository.updateVerificationStatus(ongId, true);
    
    const ong = await this.ongRepository.findById(ongId);
    
    const user = await this.userRepository.findById(ong.userId);
    user.verify();
    await this.userRepository.update(user.getId(), user);
    
    await this.notificationService.create({
      userId: ong.userId,
      type: NotificationType.ACCOUNT_VERIFIED,
      title: 'Organization Verified',
      message: 'Your organization has been verified by an administrator.',
    });    
  }

  async changeUserStatus(userId: string, status: UserStatus) {
    const user = await this.userRepository.findById(userId);
    
    if (status === UserStatus.ACTIVE) {
      user.activate();
    } else if (status === UserStatus.INACTIVE) {
      user.deactivate();
    } else {
    }
    
    await this.userRepository.update(userId, user);
  }

  async deleteUser(userId: string) {
    await this.userRepository.delete(userId);
  }
}