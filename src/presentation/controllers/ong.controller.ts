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
import { CreateOngDto } from '../dtos/requests/create-ong.dto';
import { UpdateOngDto } from '../dtos/requests/update-ong.dto';
  
  @ApiTags('ONGs')
  @Controller('ongs')
  export class OngController {
    constructor(
      private readonly ongService: OngService,
    ) {}
  
    @Get()
    @ApiOperation({ summary: 'Obtener listado de ONGs' })
    @ApiQuery({
      name: 'verified',
      required: false,
      type: Boolean,
      description: 'Filtrar por verificación',
    })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Listado de ONGs obtenido exitosamente',
    })
    async getAllOngs(
        @Query('verified') verified?: boolean,
      ) {
        // Convertimos el parámetro a un booleano explícitamente
        const isVerified = verified === true || (typeof verified === 'string' && verified === 'true');
        return await this.ongService.getAllOngs(isVerified);
      }
  
    @Get(':id')
    @ApiOperation({ summary: 'Obtener detalles de una ONG' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'Detalles de la ONG obtenidos exitosamente',
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'ONG no encontrada',
    })
    async getOngById(
      @Param('id', ParseUUIDPipe) id: string,
    ) {
      return await this.ongService.getOngById(id);
    }
  
    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('logo', {
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
    @ApiOperation({ summary: 'Registrar una nueva ONG' })
    @ApiResponse({
      status: HttpStatus.CREATED,
      description: 'ONG registrada exitosamente',
    })
    async createOng(
      @Body() createOngDto: CreateOngDto,
      @UploadedFile() logo: Express.Multer.File,
      @User() user,
    ) {
      // Verificar si el usuario ya tiene una ONG registrada
      const hasOng = await this.ongService.hasOng(user.id);
      if (hasOng) {
        throw new ForbiddenException('Ya tienes una ONG registrada');
      }
      
      // Crear la ONG
      const ong = await this.ongService.createOng({
        ...createOngDto,
        userId: user.id,
        logo,
      });
      
      return ong;
    }
  
    @Put(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ONG)
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('logo', {
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
    
    @ApiOperation({ summary: 'Actualizar información de una ONG' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'ONG actualizada exitosamente',
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'ONG no encontrada',
    })
    @ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'No tienes permisos para actualizar esta ONG',
    })
    async updateOng(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() updateOngDto: UpdateOngDto,
      @UploadedFile() logo: Express.Multer.File,
      @User() user,
    ) {
      // Verificar que la ONG exista
      const ong = await this.ongService.getOngById(id);
      
      // Verificar que el usuario sea propietario de la ONG
      if (ong.userId !== user.id && user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('No eres propietario de esta ONG');
      }
      
      // Actualizar la ONG
      return await this.ongService.updateOng(id, {
        ...updateOngDto,
        logo,
      });
    }
  
    @Get('user/me')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ONG)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obtener ONG del usuario autenticado' })
    @ApiResponse({
      status: HttpStatus.OK,
      description: 'ONG obtenida exitosamente',
    })
    @ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'No tienes una ONG registrada',
    })
    async getMyOng(
      @User() user,
    ) {
      return await this.ongService.getOngByUserId(user.id);
    }
  }