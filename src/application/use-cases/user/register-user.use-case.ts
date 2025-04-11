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
      // Verificar si el email ya está registrado
      const emailExists = await this.userRepository.exists({ email: registerUserDto.email.toLowerCase() });
      if (emailExists) {
        throw new DuplicateEntityException('usuario', 'email', registerUserDto.email);
      }

      // Verificar si el número de teléfono ya está registrado
      const phoneExists = await this.userRepository.exists({ phoneNumber: registerUserDto.phoneNumber });
      if (phoneExists) {
        throw new DuplicateEntityException('usuario', 'número de teléfono', registerUserDto.phoneNumber);
      }

      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(registerUserDto.password, 10);

      // Procesar y subir imagen de perfil si existe
      let profileImageUrl: string | undefined;
      if (registerUserDto.profileImage) {
        profileImageUrl = await this.s3Service.uploadFile(
          registerUserDto.profileImage.buffer,
          'profiles',
          registerUserDto.profileImage.originalname,
        );
      }

      // Crear entidad de dominio
      const userEntity = new UserEntity(
        null, // ID será generado
        registerUserDto.email,
        hashedPassword,
        registerUserDto.firstName,
        registerUserDto.lastName,
        registerUserDto.phoneNumber,
        registerUserDto.role,
        undefined, // estado por defecto
        false, // no verificado por defecto
        registerUserDto.address,
        profileImageUrl,
        undefined, // secreto 2FA
        false, // 2FA deshabilitado por defecto
      );

      // Guardar en el repositorio
      return await this.userRepository.create(userEntity);
    } catch (error) {
      if (error instanceof DuplicateEntityException || error instanceof BusinessRuleValidationException) {
        throw error;
      }
      
      // Si ocurre un error y ya se subió la imagen de perfil, eliminarla
      if (registerUserDto.profileImage) {
        // Intentar eliminar la imagen subida si hay un error
        try {
          // Aquí habría que tener la URL de la imagen subida para eliminarla
          // Esto es una mejora que se podría implementar
        } catch (s3Error) {
          console.error('Error al eliminar imagen de perfil:', s3Error);
        }
      }
      
      throw new Error(`Error al registrar usuario: ${error.message}`);
    }
  }
}