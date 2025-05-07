import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../../application/services/user.service';
import { UserRepository } from '../../infrastructure/database/mysql/repositories/user.repository';
import { UserEntity } from '../../infrastructure/database/mysql/entities/user.entity';
import { AwsModule } from '../../infrastructure/services/aws/aws.module';
import { EmailModule } from '../../infrastructure/services/email/email.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    AwsModule,
    EmailModule
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
  ],
  exports: [
    UserService,
    UserRepository,
  ],
})
export class UserModule {}