import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdoptionController } from '../controllers/adoption.controller';
import { AdoptionEntity } from '../../infrastructure/database/mysql/entities/adoption.entity';
import { ApproveAdoptionUseCase } from 'src/application/use-cases/adoption/approve-adoption.use-case';
import { CancelAdoptionUseCase } from 'src/application/use-cases/adoption/cancel-adoption.use-case';
import { GetAdoptionUseCase } from 'src/application/use-cases/adoption/get-adoption.use-case';
import { RejectAdoptionUseCase } from 'src/application/use-cases/adoption/reject-adoption.use-case';
import { RequestAdoptionUseCase } from 'src/application/use-cases/adoption/request-adoption.use-case';
import { GetAdoptionsUseCase } from 'src/application/use-cases/donation/get-adoptions.use-case';
import { AdoptionRepository } from 'src/infrastructure/database/mysql/repositories/adoption.repository';
import { AnimalModule } from './animal.module';
import { NotificationModule } from './notification.module';
import { OngModule } from './ong.module';


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