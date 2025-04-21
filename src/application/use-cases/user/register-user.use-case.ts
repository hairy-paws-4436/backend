import { Injectable } from '@nestjs/common';
import { UserEntity } from '../../../core/domain/user/user.entity';
import { UserRepository } from '../../../infrastructure/database/mysql/repositories/user.repository';
import { S3Service } from '../../../infrastructure/services/aws/s3.service';
import { UserRole } from '../../../core/domain/user/value-objects/user-role.enum';
import { BusinessRuleValidationException, DuplicateEntityException } from '../../../core/exceptions/domain.exception';
import * as bcrypt from 'bcrypt';

interface RegisterUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: UserRole;
  address?: string;
  profileImage?: Express.Multer.File;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(registerUserDto: RegisterUserDto): Promise<UserEntity> {
    try {
      const emailExists = await this.userRepository.exists({ email: registerUserDto.email.toLowerCase() });
      if (emailExists) {
        throw new DuplicateEntityException('user', 'email', registerUserDto.email);
      }

      const phoneExists = await this.userRepository.exists({ phoneNumber: registerUserDto.phoneNumber });
      if (phoneExists) {
        throw new DuplicateEntityException('user', 'phone number', registerUserDto.phoneNumber);
      }

      const hashedPassword = await bcrypt.hash(registerUserDto.password, 10);

      let profileImageUrl: string | undefined;
      if (registerUserDto.profileImage) {
        profileImageUrl = await this.s3Service.uploadFile(
          registerUserDto.profileImage.buffer,
          'profiles',
          registerUserDto.profileImage.originalname,
        );
      }

      const userEntity = new UserEntity(
        null,
        registerUserDto.email,
        hashedPassword,
        registerUserDto.firstName,
        registerUserDto.lastName,
        registerUserDto.phoneNumber,
        registerUserDto.role,
        undefined,
        false,
        registerUserDto.address,
        profileImageUrl,
        undefined,
        false,
      );

      return await this.userRepository.create(userEntity);
    } catch (error) {
      if (error instanceof DuplicateEntityException || error instanceof BusinessRuleValidationException) {
        throw error;
      }

      if (registerUserDto.profileImage) {
        try {
        } catch (s3Error) {
          console.error('Error deleting uploaded profile image:', s3Error);
        }
      }

      throw new Error(`Error registering user: ${error.message}`);
    }
  }
}
