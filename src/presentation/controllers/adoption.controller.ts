import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    UseGuards,
    Query,
    ParseUUIDPipe,
    HttpStatus,
    ForbiddenException,
    NotFoundException,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
  import { JwtAuthGuard } from '../guards/jwt-auth.guard';
  import { RolesGuard } from '../guards/roles.guard';
  import { Roles } from '../decorators/roles.decorator';
  import { User } from '../decorators/user.decorator';
  import { UserRole } from '../../core/domain/user/value-objects/user-role.enum';

  import { RequestAdoptionUseCase } from '../../application/use-cases/adoption/request-adoption.use-case';

  import { AdoptionType } from '../../core/domain/adoption/value-objects/adoption-type.enum';
  import { AdoptionStatus } from '../../core/domain/adoption/value-objects/adoption-status.enum';
import { ApproveAdoptionUseCase } from 'src/application/use-cases/adoption/approve-adoption.use-case';
import { CancelAdoptionUseCase } from 'src/application/use-cases/adoption/cancel-adoption.use-case';
import { GetAdoptionUseCase } from 'src/application/use-cases/adoption/get-adoption.use-case';
import { RejectAdoptionUseCase } from 'src/application/use-cases/adoption/reject-adoption.use-case';
import { GetAdoptionsUseCase } from 'src/application/use-cases/donation/get-adoptions.use-case';
import { ApproveAdoptionDto } from '../dtos/requests/approve-adoption.dto';
import { RejectAdoptionDto } from '../dtos/requests/reject-adoption.dto';
import { RequestAdoptionDto } from '../dtos/requests/request-adoption.dto';
  
  @ApiTags('Adopciones')
  @Controller('adoptions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  export class AdoptionController {
    constructor(
      private readonly requestAdoptionUseCase: RequestAdoptionUseCase,
      private readonly approveAdoptionUseCase: ApproveAdoptionUseCase,
      private readonly rejectAdoptionUseCase: RejectAdoptionUseCase,
      private readonly getAdoptionUseCase: GetAdoptionUseCase,
      private readonly getAdoptionsUseCase: GetAdoptionsUseCase,
      private readonly cancelAdoptionUseCase: CancelAdoptionUseCase,
    ) {}
  
    @Post()
    @Roles(UserRole.ADOPTER)
    @ApiOperation({ summary: 'Solicitar adopción o visita' })
    @ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Solicitud creada exitosamente',
    })
    async requestAdoption(
      @Body() requestAdoptionDto: RequestAdoptionDto,
      @User() user,
    ) {
      const adoption = await this.requestAdoptionUseCase.execute({
        ...requestAdoptionDto,
        adopterId: user.id,
      });
      
      return adoption.toObject();
    }
  
    @Get()
    @ApiOperation({ summary: 'Obtener solicitudes de adopción según el rol del usuario' })
    @ApiQuery({
      name: 'type',
      required: false,
      enum: AdoptionType,
      description: 'Filtrar por tipo de solicitud',
    })
    @ApiQuery({
      name: 'status',
      required: false,
      enum: AdoptionStatus,
      description: 'Filtrar por estado de solicitud',
    })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Solicitudes obtenidas exitosamente',
    })
    async getAdoptions(
      @User() user,
      @Query('type') type?: AdoptionType,
      @Query('status') status?: AdoptionStatus,
    ) {
      const filters = {
        ...(type && { type }),
        ...(status && { status }),
      };
      
      let adoptions;
      
      // Filtrar según el rol del usuario
      if (user.role === UserRole.ADOPTER) {
        // Obtener solicitudes hechas por el adoptante
        adoptions = await this.getAdoptionsUseCase.execute({
          ...filters,
          adopterId: user.id,
        });
      } else if (user.role === UserRole.OWNER) {
        // Obtener solicitudes recibidas por el dueño
        adoptions = await this.getAdoptionsUseCase.execute({
          ...filters,
          ownerId: user.id,
        });
      } else if (user.role === UserRole.ADMIN) {
        // Administradores pueden ver todas las solicitudes
        adoptions = await this.getAdoptionsUseCase.execute(filters);
      } else {
        throw new ForbiddenException('No tienes permisos para ver solicitudes de adopción');
      }
      
      return adoptions.map(adoption => adoption.toObject());
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Obtener detalles de una solicitud de adopción' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Solicitud obtenida exitosamente',
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Solicitud no encontrada',
    })
    @ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'No tienes permisos para ver esta solicitud',
    })
    async getAdoption(
      @Param('id', ParseUUIDPipe) id: string,
      @User() user,
    ) {
      // Obtener la solicitud
      const adoption = await this.getAdoptionUseCase.execute(id);
      
      // Verificar permisos
      if (
        user.role !== UserRole.ADMIN &&
        user.id !== adoption.getAdopterId() &&
        user.id !== adoption.getOwnerId()
      ) {
        throw new ForbiddenException('No tienes permisos para ver esta solicitud');
      }
      
      return adoption.toObject();
    }
  
    @Put(':id/approve')
    @Roles(UserRole.OWNER)
    @ApiOperation({ summary: 'Aprobar una solicitud de adopción' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Solicitud aprobada exitosamente',
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Solicitud no encontrada',
    })
    @ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'No tienes permisos para aprobar esta solicitud',
    })
    async approveAdoption(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() approveAdoptionDto: ApproveAdoptionDto,
      @User() user,
    ) {
      // Obtener la solicitud
      const adoption = await this.getAdoptionUseCase.execute(id);
      
      // Verificar que el usuario sea el dueño
      if (user.id !== adoption.getOwnerId()) {
        throw new ForbiddenException('No eres el dueño de esta mascota');
      }
      
      // Aprobar la solicitud
      const approvedAdoption = await this.approveAdoptionUseCase.execute({
        adoptionId: id,
        notes: approveAdoptionDto.notes,
      });
      
      return approvedAdoption.toObject();
    }
  
    @Put(':id/reject')
    @Roles(UserRole.OWNER)
    @ApiOperation({ summary: 'Rechazar una solicitud de adopción' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Solicitud rechazada exitosamente',
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Solicitud no encontrada',
    })
    @ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'No tienes permisos para rechazar esta solicitud',
    })
    async rejectAdoption(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() rejectAdoptionDto: RejectAdoptionDto,
      @User() user,
    ) {
      // Obtener la solicitud
      const adoption = await this.getAdoptionUseCase.execute(id);
      
      // Verificar que el usuario sea el dueño
      if (user.id !== adoption.getOwnerId()) {
        throw new ForbiddenException('No eres el dueño de esta mascota');
      }
      
      // Rechazar la solicitud
      const rejectedAdoption = await this.rejectAdoptionUseCase.execute({
        adoptionId: id,
        reason: rejectAdoptionDto.reason,
      });
      
      return rejectedAdoption.toObject();
    }
  
    @Put(':id/cancel')
    @ApiOperation({ summary: 'Cancelar una solicitud de adopción' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Solicitud cancelada exitosamente',
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Solicitud no encontrada',
    })
    @ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'No tienes permisos para cancelar esta solicitud',
    })
    async cancelAdoption(
      @Param('id', ParseUUIDPipe) id: string,
      @User() user,
    ) {
      // Obtener la solicitud
      const adoption = await this.getAdoptionUseCase.execute(id);
      
      // Verificar que el usuario sea el adoptante o el dueño
      if (user.id !== adoption.getAdopterId() && user.id !== adoption.getOwnerId() && user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('No tienes permisos para cancelar esta solicitud');
      }
      
      // Cancelar la solicitud
      const cancelledAdoption = await this.cancelAdoptionUseCase.execute({
        adoptionId: id,
      });
      
      return cancelledAdoption.toObject();
    }
  }