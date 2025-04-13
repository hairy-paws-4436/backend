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
  UploadedFiles,
  Query,
  ParseUUIDPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { User } from '../decorators/user.decorator';
import { UserRole } from '../../core/domain/user/value-objects/user-role.enum';
import { Public } from '../decorators/public.decorator';
import { ForbiddenException } from '@nestjs/common';
import { CreateAnimalUseCase } from 'src/application/use-cases/animal/create-animal.use-case';
import { DeleteAnimalUseCase } from 'src/application/use-cases/animal/delete-animal.use-case';
import { GetAnimalUseCase } from 'src/application/use-cases/animal/get-animal.use-case';
import { GetAnimalsUseCase } from 'src/application/use-cases/animal/get-animals.use-case';
import { CreateAnimalDto } from '../dtos/requests/create-animal.dto';
import { UpdateAnimalDto } from '../dtos/requests/update-animal.dto';
import { UpdateAnimalUseCase } from 'src/application/use-cases/animal/update-animal.use-case';
import { AnimalType } from 'src/core/domain/animal/value-objects/animal-type.enum';

@ApiTags('Mascotas')
@Controller('animals')
export class AnimalController {
  constructor(
    private readonly createAnimalUseCase: CreateAnimalUseCase,
    private readonly updateAnimalUseCase: UpdateAnimalUseCase,
    private readonly getAnimalUseCase: GetAnimalUseCase,
    private readonly getAnimalsUseCase: GetAnimalsUseCase,
    private readonly deleteAnimalUseCase: DeleteAnimalUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener listado de mascotas disponibles para adopción',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Listado de mascotas obtenido exitosamente',
  })
  async getAvailableAnimals(
    @Query('type') typeStr?: string,
    @Query('breed') breed?: string,
  ) {
    // Convertir el string al enum
    const type = typeStr ? (typeStr as AnimalType) : undefined;

    const filters = {
      availableForAdoption: true,
      ...(type && { type }),
      ...(breed && { breed }),
    };

    const animals = await this.getAnimalsUseCase.execute(filters);
    return animals.map((animal) => animal.toObject());
  }

  @Get('owner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener mascotas del usuario autenticado (dueño)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Listado de mascotas obtenido exitosamente',
  })
  async getOwnerAnimals(@User() user) {
    const animals = await this.getAnimalsUseCase.execute({ ownerId: user.id });
    return animals.map((animal) => animal.toObject());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de una mascota' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detalles de la mascota obtenidos exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Mascota no encontrada',
  })
  async getAnimal(@Param('id', ParseUUIDPipe) id: string) {
    const animal = await this.getAnimalUseCase.execute(id);
    return animal.toObject();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/image\/(jpg|jpeg|png|gif)$/)) {
          return cb(
            new Error(
              'Solo se permiten archivos de imagen (jpg, jpeg, png, gif)',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Crear una nueva mascota' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Mascota creada exitosamente',
  })
  async createAnimal(
    @Body() createAnimalDto: CreateAnimalDto,
    @UploadedFiles() images: Express.Multer.File[],
    @User() user,
  ) {
    // Asignar el ID del usuario autenticado como dueño
    const animal = await this.createAnimalUseCase.execute({
      ...createAnimalDto,
      ownerId: user.id,
      images,
    });

    return animal.toObject();
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/image\/(jpg|jpeg|png|gif)$/)) {
          return cb(
            new Error(
              'Solo se permiten archivos de imagen (jpg, jpeg, png, gif)',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Actualizar información de una mascota' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mascota actualizada exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Mascota no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permisos para actualizar esta mascota',
  })
  async updateAnimal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAnimalDto: UpdateAnimalDto,
    @UploadedFiles() images: Express.Multer.File[],
    @User() user,
  ) {
    // Verificar que el usuario sea el dueño de la mascota
    const animal = await this.getAnimalUseCase.execute(id);
    if (animal.getOwnerId() !== user.id) {
      throw new ForbiddenException('No eres el dueño de esta mascota');
    }

    const updatedAnimal = await this.updateAnimalUseCase.execute(id, {
      ...updateAnimalDto,
      images,
    });

    return updatedAnimal.toObject();
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una mascota' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Mascota eliminada exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Mascota no encontrada',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No tienes permisos para eliminar esta mascota',
  })
  async deleteAnimal(@Param('id', ParseUUIDPipe) id: string, @User() user) {
    // Verificar que el usuario sea el dueño de la mascota o un administrador
    if (user.role !== UserRole.ADMIN) {
      const animal = await this.getAnimalUseCase.execute(id);
      if (animal.getOwnerId() !== user.id) {
        throw new ForbiddenException('No eres el dueño de esta mascota');
      }
    }

    await this.deleteAnimalUseCase.execute(id);
    return { statusCode: HttpStatus.NO_CONTENT };
  }


  

}
