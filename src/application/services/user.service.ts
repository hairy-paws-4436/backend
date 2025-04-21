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

  async getUserById(userId: string): Promise<UserEntity> {
    return await this.userRepository.findById(userId);
  }

  async updateProfile(
    userId: string,
    updateData: UpdateProfileDto,
  ): Promise<UserEntity> {
    if (updateData.phoneNumber) {
      const existingUser = await this.userRepository.findOne({
        phoneNumber: updateData.phoneNumber,
      });
      
      if (existingUser && existingUser.getId() !== userId) {
        throw new DuplicateEntityException(
          'user',
          'phone number',
          updateData.phoneNumber,
        );
      }
    }
    
    const user = await this.userRepository.findById(userId);
    
    let profileImageUrl: string | undefined;
    if (updateData.profileImage) {
      profileImageUrl = await this.s3Service.uploadFile(
        updateData.profileImage.buffer,
        'profiles',
        updateData.profileImage.originalname,
      );
      
      const currentImage = user.getProfileImageUrl();
      if (currentImage) {
        try {
          await this.s3Service.deleteFile(currentImage);
        } catch (error) {
          console.error(`Error deleting old image: ${error.message}`);
        }
      }
    }
    
    user.updateProfile(
      updateData.firstName,
      updateData.lastName,
      updateData.phoneNumber,
      updateData.address,
    );
    
    if (profileImageUrl) {
      user.updateProfileImage(profileImageUrl);
    }
    
    return await this.userRepository.update(userId, user);
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.oldPassword,
      user.getPassword(),
    );
    
    if (!isPasswordValid) {
      throw new Error('Incorrect current password');
    }
    
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    
    user.updatePassword(hashedPassword);
    
    await this.userRepository.update(userId, user);
  }

  async deactivateAccount(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    
    user.deactivate();
    
    await this.userRepository.update(userId, user);
  }
}
