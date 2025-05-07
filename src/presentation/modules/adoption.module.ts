import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdoptionController } from '../controllers/adoption.controller';
import { AdoptionEntity } from '../../infrastructure/database/mysql/entities/adoption.entity';

import { AnimalModule } from './animal.module';
import { NotificationModule } from './notification.module';
import { OngModule } from './ong.module';
import { AdoptionRepository } from '../../infrastructure/database/mysql/repositories/adoption.repository';
import { RequestAdoptionUseCase } from '../../application/use-cases/adoption/request-adoption.use-case';
import { GetAdoptionsUseCase } from '../../application/use-cases/donation/get-adoptions.use-case';
import { ApproveAdoptionUseCase } from '../../application/use-cases/adoption/approve-adoption.use-case';
import { RejectAdoptionUseCase } from '../../application/use-cases/adoption/reject-adoption.use-case';
import { GetAdoptionUseCase } from '../../application/use-cases/adoption/get-adoption.use-case';
import { CancelAdoptionUseCase } from '../../application/use-cases/adoption/cancel-adoption.use-case';


@Module({
  imports: [
    TypeOrmModule.forFeature([AdoptionEntity]),
    forwardRef(() => AnimalModule),
    NotificationModule,
    OngModule
  ],
  controllers: [AdoptionController],
  providers: [
    AdoptionRepository,
    RequestAdoptionUseCase,
    ApproveAdoptionUseCase,
    RejectAdoptionUseCase,
    GetAdoptionUseCase,
    GetAdoptionsUseCase,
    CancelAdoptionUseCase,
  ],
  exports: [
    AdoptionRepository,
  ],
})
export class AdoptionModule {}