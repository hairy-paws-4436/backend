import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../infrastructure/database/mysql/repositories/user.repository';
import { S3Service } from '../../infrastructure/services/aws/s3.service';
import { UserEntity } from '../../core/domain/user/user.entity';
import { DuplicateEntityException } from '../../core/exceptions/domain.exception';
import * as bcrypt from 'bcrypt';

interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  profileImage?: Express.Multer.File;
}

interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly s3Service: S3Service,
  ) {}

  /**
   * Obtiene un usuario por su ID
   * @param userId ID del usuario
   * @returns Entidad de usuario
   */
  async getUserById(userId: string): Promise<UserEntity> {
    return await this.userRepository.findById(userId);
  }

  /**
   * Actualiza el perfil de un usuario
   * @param userId ID del usuario
   * @param updateData Datos a actualizar
   * @returns Usuario actualizado
   */
  async updateProfile(
    userId: string,
    updateData: UpdateProfileDto,
  ): Promise<UserEntity> {
    // Verificar si el número de teléfono ya está en uso
    if (updateData.phoneNumber) {
      const phoneExists = await this.userRepository.exists({
        phoneNumber: updateData.phoneNumber,
        id: { $ne: userId }, // Excluir el usuario actual
      });
      
      if (phoneExists) {
        throw new DuplicateEntityException(
          'usuario',
          'número de teléfono',
          updateData.phoneNumber,
        );
      }
    }
    
    // Obtener usuario actual
    const user = await this.userRepository.findById(userId);
    
    // Procesar imagen de perfil si se proporciona
    let profileImageUrl: string | undefined;
    if (updateData.profileImage) {
      profileImageUrl = await this.s3Service.uploadFile(
        updateData.profileImage.buffer,
        'profiles',
        updateData.profileImage.originalname,
      );
      
      // Eliminar imagen antigua si existe
      const currentImage = user.getProfileImageUrl();
      if (currentImage) {
        try {
          await this.s3Service.deleteFile(currentImage);
        } catch (error) {
          // Solo log, no fallar si no se puede eliminar la imagen antigua
          console.error(`Error al eliminar imagen antigua: ${error.message}`);
        }
      }
    }
    
    // Actualizar usuario
    user.updateProfile(
      updateData.firstName,
      updateData.lastName,
      updateData.phoneNumber,
      updateData.address,
    );
    
    // Actualizar imagen de perfil si se proporciona
    if (profileImageUrl) {
      user.updateProfileImage(profileImageUrl);
    }
    
    // Guardar cambios
    return await this.userRepository.update(userId, user);
  }

  /**
   * Cambia la contraseña de un usuario
   * @param userId ID del usuario
   * @param changePasswordDto Datos para cambio de contraseña
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    // Obtener usuario
    const user = await this.userRepository.findById(userId);
    
    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.oldPassword,
      user.getPassword(),
    );
    
    if (!isPasswordValid) {
      throw new Error('Contraseña actual incorrecta');
    }
    
    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    
    // Actualizar contraseña
    user.updatePassword(hashedPassword);
    
    // Guardar cambios
    await this.userRepository.update(userId, user);
  }

  /**
   * Desactiva la cuenta de un usuario
   * @param userId ID del usuario
   */
  async deactivateAccount(userId: string): Promise<void> {
    // Obtener usuario
    const user = await this.userRepository.findById(userId);
    
    // Desactivar cuenta
    user.deactivate();
    
    // Guardar cambios
    await this.userRepository.update(userId, user);
  }
}