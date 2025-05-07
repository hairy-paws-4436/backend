import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OngController } from '../controllers/ong.controller';
import { OngEntity } from '../../infrastructure/database/mysql/entities/ong.entity';

import { OngService } from '../../application/services/ong.service';
import { UserModule } from './user.module';
import { AwsModule } from '../../infrastructure/services/aws/aws.module';
import { OngRepository } from '../../infrastructure/database/mysql/repositories/ong.repository';


@Module({
  imports: [
    TypeOrmModule.forFeature([OngEntity]),
    UserModule,
    AwsModule,
  ],
  controllers: [OngController],
  providers: [
    OngRepository,
    OngService,
  ],
  exports: [
    OngRepository,
    OngService,
  ],
})
export class OngModule {}