import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Query,
    ParseUUIDPipe,
    HttpStatus,
    ForbiddenException,
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiQuery } from '@nestjs/swagger';
  import { JwtAuthGuard } from '../guards/jwt-auth.guard';
  import { RolesGuard } from '../guards/roles.guard';
  import { Roles } from '../decorators/roles.decorator';
  import { User } from '../decorators/user.decorator';
  import { UserRole } from '../../core/domain/user/value-objects/user-role.enum';

  import { OngService } from '../../application/services/ong.service';
  import { DonationType } from '../../core/domain/donation/value-objects/donation-type.enum';
  import { DonationStatus } from '../../core/domain/donation/value-objects/donation-status.enum';
import { DonationService } from 'src/application/services/donation.service';
import { ConfirmDonationDto } from '../dtos/requests/confirm-donation.dto';
import { CreateDonationDto } from '../dtos/requests/create-donation.dto';
  
  @ApiTags('Donaciones')
  @Controller('donations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  export class DonationController {
    constructor(
      private readonly donationService: DonationService,
      private readonly ongService: OngService,
    ) {}
  
    @Post()
    @UseInterceptors(FileInterceptor('receipt', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/image\/(jpg|jpeg|png|gif)$/) && !file.mimetype.match(/application\/pdf$/)) {
          return cb(new Error('Solo se permiten imágenes o PDFs'), false);
        }
        cb(null, true);
      },
    }))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Registrar una nueva donación' })
    @ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Donación registrada exitosamente',
    })
    async createDonation(
      @Body() createDonationDto: CreateDonationDto,
      @UploadedFile() receipt: Express.Multer.File,
      @User() user,
    ) {
      // Crear la donación
      const donation = await this.donationService.createDonation({
        ...createDonationDto,
        donorId: user.id,
        receipt,
      });
      
      return donation;
    }
  
    @Get()
    @ApiOperation({ summary: 'Obtener donaciones según el rol del usuario' })
    @ApiQuery({
      name: 'ongId',
      required: false,
      type: String,
      description: 'ID de la ONG para filtrar donaciones',
    })
    @ApiQuery({
      name: 'type',
      required: false,
      enum: DonationType,
      description: 'Filtrar por tipo de donación',
    })
    @ApiQuery({
      name: 'status',
      required: false,
      enum: DonationStatus,
      description: 'Filtrar por estado de donación',
    })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Donaciones obtenidas exitosamente',
    })
    async getDonations(
      @User() user,
      @Query('ongId') ongId?: string,
      @Query('type') type?: DonationType,
      @Query('status') status?: DonationStatus,
    ) {
      const filters = {
        ...(type && { type }),
        ...(status && { status }),
      };
      
      // Filtrar según el rol del usuario
      if (user.role === UserRole.ONG) {
        // Obtener ONG del usuario
        const ong = await this.ongService.getOngByUserId(user.id);
        filters['ongId'] = ong.id;
      } else if (user.role !== UserRole.ADMIN) {
        // Los usuarios normales solo ven sus propias donaciones
        filters['donorId'] = user.id;
      } else if (ongId) {
        // Admins pueden filtrar por ONG si lo desean
        filters['ongId'] = ongId;
      }
      
      return await this.donationService.getDonations(filters);
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Obtener detalles de una donación' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Detalles de la donación obtenidos exitosamente',
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Donación no encontrada',
    })
    @ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'No tienes permisos para ver esta donación',
    })
    async getDonationById(
      @Param('id', ParseUUIDPipe) id: string,
      @User() user,
    ) {
      // Obtener la donación
      const donation = await this.donationService.getDonationById(id);
      
      // Verificar permisos
      if (
        user.role !== UserRole.ADMIN &&
        user.id !== donation.donorId
      ) {
        // Si es ONG, verificar que la donación sea para esta ONG
        if (user.role === UserRole.ONG) {
          const ong = await this.ongService.getOngByUserId(user.id);
          if (donation.ongId !== ong.id) {
            throw new ForbiddenException('No tienes permisos para ver esta donación');
          }
        } else {
          throw new ForbiddenException('No tienes permisos para ver esta donación');
        }
      }
      
      return donation;
    }
  
    @Put(':id/confirm')
    @Roles(UserRole.ONG)
    @ApiOperation({ summary: 'Confirmar recepción de una donación' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Donación confirmada exitosamente',
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Donación no encontrada',
    })
    @ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'No tienes permisos para confirmar esta donación',
    })
    async confirmDonation(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() confirmDonationDto: ConfirmDonationDto,
      @User() user,
    ) {
      // Obtener la donación
      const donation = await this.donationService.getDonationById(id);
      
      // Verificar que la ONG sea la receptora de la donación
      const ong = await this.ongService.getOngByUserId(user.id);
      if (donation.ongId !== ong.id) {
        throw new ForbiddenException('No eres el receptor de esta donación');
      }
      
      // Confirmar la donación
      return await this.donationService.confirmDonation(id, user.id, confirmDonationDto.notes);
    }
  
    @Put(':id/cancel')
    @ApiOperation({ summary: 'Cancelar una donación' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Donación cancelada exitosamente',
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Donación no encontrada',
    })
    @ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'No tienes permisos para cancelar esta donación',
    })
    async cancelDonation(
      @Param('id', ParseUUIDPipe) id: string,
      @User() user,
    ) {
      // Obtener la donación
      const donation = await this.donationService.getDonationById(id);
      
      // Solo el donante, la ONG receptora o un admin pueden cancelar
      if (
        user.role !== UserRole.ADMIN &&
        user.id !== donation.donorId
      ) {
        // Si es ONG, verificar que sea la receptora
        if (user.role === UserRole.ONG) {
          const ong = await this.ongService.getOngByUserId(user.id);
          if (donation.ongId !== ong.id) {
            throw new ForbiddenException('No tienes permisos para cancelar esta donación');
          }
        } else {
          throw new ForbiddenException('No tienes permisos para cancelar esta donación');
        }
      }
      
      // Solo se pueden cancelar donaciones pendientes
      if (donation.status !== DonationStatus.PENDING) {
        throw new ForbiddenException('Solo se pueden cancelar donaciones pendientes');
      }
      
      // Cancelar la donación
      return await this.donationService.cancelDonation(id);
    }
  }