import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Query,
    ParseUUIDPipe,
    HttpStatus,
    ForbiddenException,
    ParseBoolPipe,
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiQuery } from '@nestjs/swagger';
  import { JwtAuthGuard } from '../guards/jwt-auth.guard';
  import { RolesGuard } from '../guards/roles.guard';
  import { Roles } from '../decorators/roles.decorator';
  import { User } from '../decorators/user.decorator';
  import { UserRole } from '../../core/domain/user/value-objects/user-role.enum';

  import { OngService } from '../../application/services/ong.service';
import { EventService } from 'src/application/services/event.service';
import { CreateEventDto } from '../dtos/requests/create-event.dto';
import { UpdateEventDto } from '../dtos/requests/update-event.dto';
  
  @ApiTags('Eventos')
  @Controller('events')
  export class EventController {
    constructor(
      private readonly eventService: EventService,
      private readonly ongService: OngService,
    ) {}
  
    @Get()
    @ApiOperation({ summary: 'Obtener listado de eventos' })
    @ApiQuery({
      name: 'ongId',
      required: false,
      type: String,
      description: 'ID de la ONG para filtrar eventos',
    })
    @ApiQuery({
      name: 'active',
      required: false,
      type: Boolean,
      description: 'Filtrar por eventos activos/inactivos',
    })
    @ApiQuery({
      name: 'isVolunteer',
      required: false,
      type: Boolean,
      description: 'Filtrar por eventos de voluntariado',
    })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Listado de eventos obtenido exitosamente',
    })
    async getAllEvents(
        @Query('ongId') ongId?: string,
        @Query('active', new ParseBoolPipe({ optional: true })) active?: boolean,
        @Query('isVolunteer', new ParseBoolPipe({ optional: true })) isVolunteer?: boolean,
      ) {
        const filters = {
          ...(ongId && { ongId }),
          ...(active !== undefined && { active }),
          ...(isVolunteer !== undefined && { isVolunteerEvent: isVolunteer }),
        };
        
        return await this.eventService.getAllEvents(filters);
      }
  
    @Get(':id')
    @ApiOperation({ summary: 'Obtener detalles de un evento' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Detalles del evento obtenidos exitosamente',
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Evento no encontrado',
    })
    async getEventById(
      @Param('id', ParseUUIDPipe) id: string,
    ) {
      return await this.eventService.getEventById(id);
    }
  
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ONG)
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('image', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/image\/(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Solo se permiten archivos de imagen (jpg, jpeg, png, gif)'), false);
        }
        cb(null, true);
      },
    }))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Crear un nuevo evento' })
    @ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Evento creado exitosamente',
    })
    async createEvent(
      @Body() createEventDto: CreateEventDto,
      @UploadedFile() image: Express.Multer.File,
      @User() user,
    ) {
      // Verificar que el usuario tenga una ONG
      const ong = await this.ongService.getOngByUserId(user.id);
      
      // Crear el evento
      return await this.eventService.createEvent({
        ...createEventDto,
        ongId: ong.id,
        image,
      });
    }
  
    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ONG)
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('image', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/image\/(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Solo se permiten archivos de imagen (jpg, jpeg, png, gif)'), false);
        }
        cb(null, true);
      },
    }))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Actualizar información de un evento' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Evento actualizado exitosamente',
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Evento no encontrado',
    })
    @ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'No tienes permisos para actualizar este evento',
    })
    async updateEvent(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() updateEventDto: UpdateEventDto,
      @UploadedFile() image: Express.Multer.File,
      @User() user,
    ) {
      // Verificar que el evento exista
      const event = await this.eventService.getEventById(id);
      
      // Verificar que el usuario sea propietario de la ONG
      const ong = await this.ongService.getOngByUserId(user.id);
      
      if (event.ongId !== ong.id && user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('No eres propietario de este evento');
      }
      
      // Actualizar el evento
      return await this.eventService.updateEvent(id, {
        ...updateEventDto,
        image,
      });
    }
  
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ONG, UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Eliminar un evento' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Evento eliminado exitosamente',
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Evento no encontrado',
    })
    @ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'No tienes permisos para eliminar este evento',
    })
    async deleteEvent(
      @Param('id', ParseUUIDPipe) id: string,
      @User() user,
    ) {
      // Verificar que el evento exista
      const event = await this.eventService.getEventById(id);
      
      // Si no es admin, verificar que sea propietario de la ONG
      if (user.role !== UserRole.ADMIN) {
        const ong = await this.ongService.getOngByUserId(user.id);
        
        if (event.ongId !== ong.id) {
          throw new ForbiddenException('No eres propietario de este evento');
        }
      }
      
      // Eliminar el evento
      await this.eventService.deleteEvent(id);
      
      return { message: 'Evento eliminado correctamente' };
    }
  }