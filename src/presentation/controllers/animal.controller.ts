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

@ApiTags('Animals')
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
    summary: 'Get a list of available animals for adoption',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of animals retrieved successfully',
  })
  async getAvailableAnimals(
    @Query('type') typeStr?: string,
    @Query('breed') breed?: string,
  ) {
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
  @Roles(UserRole.OWNER, UserRole.ONG)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the authenticated user\'s animals (owner)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of animals retrieved successfully',
  })
  async getOwnerAnimals(@User() user) {
    const animals = await this.getAnimalsUseCase.execute({ ownerId: user.id });
    return animals.map((animal) => animal.toObject());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of an animal' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Animal details retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Animal not found',
  })
  async getAnimal(@Param('id', ParseUUIDPipe) id: string) {
    const animal = await this.getAnimalUseCase.execute(id);
    return animal.toObject();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ONG)
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
              'Only image files (jpg, jpeg, png, gif) are allowed',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new animal' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Animal created successfully',
  })
  async createAnimal(
    @Body() createAnimalDto: CreateAnimalDto,
    @UploadedFiles() images: Express.Multer.File[],
    @User() user,
  ) {
    const animal = await this.createAnimalUseCase.execute({
      ...createAnimalDto,
      ownerId: user.id,
      images,
    });

    return animal.toObject();
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ONG)
  @ApiBearerAuth()
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/image\/(jpg|jpeg|png|gif)$/)) {
          return cb(
            new Error(
              'Only image files (jpg, jpeg, png, gif) are allowed',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update animal information' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Animal updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Animal not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'You do not have permission to update this animal',
  })
  async updateAnimal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAnimalDto: UpdateAnimalDto,
    @UploadedFiles() images: Express.Multer.File[],
    @User() user,
  ) {
    const animal = await this.getAnimalUseCase.execute(id);
    if (animal.getOwnerId() !== user.id) {
      throw new ForbiddenException('You are not the owner of this animal');
    }

    const updatedAnimal = await this.updateAnimalUseCase.execute(id, {
      ...updateAnimalDto,
      images,
    });

    return updatedAnimal.toObject();
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.ONG)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an animal' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Animal deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Animal not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'You do not have permission to delete this animal',
  })
  async deleteAnimal(@Param('id', ParseUUIDPipe) id: string, @User() user) {
    if (user.role !== UserRole.ADMIN) {
      const animal = await this.getAnimalUseCase.execute(id);
      if (animal.getOwnerId() !== user.id) {
        throw new ForbiddenException('You are not the owner of this animal');
      }
    }

    await this.deleteAnimalUseCase.execute(id);
    return { statusCode: HttpStatus.NO_CONTENT };
  }
}
