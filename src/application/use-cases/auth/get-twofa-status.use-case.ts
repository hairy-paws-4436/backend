import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../../infrastructure/database/mysql/repositories/user.repository';

@Injectable()
export class GetTwoFactorStatusUseCase {
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new Error('Usuario no encontrado');
    }
    
    return user.isTwoFactorEnabled();
  }
}