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
  ParseIntPipe,
  ParseFloatPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { User } from '../decorators/user.decorator';
import { UserRole } from '../../core/domain/user/value-objects/user-role.enum';
import { CreateUserPreferencesDto } from '../dtos/requests/create-user-preferences.dto';
import { CreateAnimalProfileDto } from '../dtos/requests/create-animal-profile.dto';
import { IntelligentMatchingService } from '../../application/services/intelligent-matching.service';
import { UserPreferencesRepository } from '../../infrastructure/database/mysql/repositories/user-preferences.repository';
import { AnimalProfileRepository } from '../../infrastructure/database/mysql/repositories/animal-profile.repository';

@ApiTags('Intelligent Matching')
@Controller('matching')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MatchingController {
  constructor(
    private readonly matchingService: IntelligentMatchingService,
    private readonly userPreferencesRepository: UserPreferencesRepository,
    private readonly animalProfileRepository: AnimalProfileRepository,
  ) {}

  // === PREFERENCIAS DE USUARIO ===

  @Post('preferences')
  @Roles(UserRole.ADOPTER)
  @ApiOperation({ summary: 'Crear o actualizar preferencias de adopción del usuario' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Preferencias guardadas exitosamente',
  })
  async createOrUpdatePreferences(
    @Body() createPreferencesDto: CreateUserPreferencesDto,
    @User() user,
  ) {
    const existingPreferences = await this.userPreferencesRepository.findByUserIdOptional(user.id);

    if (existingPreferences) {
      const updatedPreferences = await this.userPreferencesRepository.update(user.id, {
        ...createPreferencesDto,
        isComplete: true,
        completionDate: new Date(),
      });

      return {
        message: 'Preferencias actualizadas exitosamente',
        preferences: updatedPreferences,
        isNewUser: false,
      };
    } else {
      const newPreferences = await this.userPreferencesRepository.create({
        ...createPreferencesDto,
        userId: user.id,
        isComplete: true,
        completionDate: new Date(),
      });

      return {
        message: 'Preferencias creadas exitosamente',
        preferences: newPreferences,
        isNewUser: true,
      };
    }
  }

  @Get('preferences')
  @Roles(UserRole.ADOPTER)
  @ApiOperation({ summary: 'Obtener preferencias del usuario' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Preferencias obtenidas exitosamente',
  })
  async getUserPreferences(@User() user) {
    const preferences = await this.userPreferencesRepository.findByUserIdOptional(user.id);

    return {
      preferences,
      hasPreferences: !!preferences,
      isComplete: preferences?.isComplete || false,
    };
  }

  @Get('preferences/status')
  @Roles(UserRole.ADOPTER)
  @ApiOperation({ summary: 'Verificar si el usuario ha completado sus preferencias' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estado de preferencias verificado',
    schema: {
      type: 'object',
      properties: {
        hasCompletedPreferences: { type: 'boolean' },
        needsOnboarding: { type: 'boolean' },
      },
    },
  })
  async getPreferencesStatus(@User() user) {
    const preferences = await this.userPreferencesRepository.findByUserIdOptional(user.id);

    return {
      hasCompletedPreferences: preferences?.isComplete || false,
      needsOnboarding: !preferences || !preferences.isComplete,
    };
  }

  // === PERFILES DE ANIMALES ===

  @Post('animals/:animalId/profile')
  @Roles(UserRole.OWNER, UserRole.ONG)
  @ApiOperation({ summary: 'Crear perfil detallado de una mascota' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Perfil de mascota creado exitosamente',
  })
  async createAnimalProfile(
    @Param('animalId', ParseUUIDPipe) animalId: string,
    @Body() createProfileDto: CreateAnimalProfileDto,
    @User() user,
  ) {
    // TODO: Verificar que el usuario sea dueño del animal

    const existingProfile = await this.animalProfileRepository.findByAnimalIdOptional(animalId);

    if (existingProfile) {
      const updatedProfile = await this.animalProfileRepository.update(animalId, createProfileDto);
      return {
        message: 'Perfil de mascota actualizado exitosamente',
        profile: updatedProfile,
      };
    } else {
      const newProfile = await this.animalProfileRepository.create({
        ...createProfileDto,
        animalId,
      });
      return {
        message: 'Perfil de mascota creado exitosamente',
        profile: newProfile,
      };
    }
  }

  @Get('animals/:animalId/profile')
  @ApiOperation({ summary: 'Obtener perfil detallado de una mascota' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Perfil obtenido exitosamente',
  })
  async getAnimalProfile(@Param('animalId', ParseUUIDPipe) animalId: string) {
    const profile = await this.animalProfileRepository.findByAnimalIdOptional(animalId);

    return {
      profile,
      hasProfile: !!profile,
    };
  }

  // === MATCHING INTELIGENTE ===

  @Get('recommendations')
  @Roles(UserRole.ADOPTER)
  @ApiOperation({ summary: 'Obtener recomendaciones personalizadas de mascotas' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Número máximo de recomendaciones (default: 20)',
  })
  @ApiQuery({
    name: 'minScore',
    required: false,
    type: Number,
    description: 'Puntuación mínima de compatibilidad (0-1, default: 0.3)',
  })
  @ApiQuery({
    name: 'includeSpecialNeeds',
    required: false,
    type: Boolean,
    description: 'Incluir mascotas con necesidades especiales (default: false)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recomendaciones generadas exitosamente',
  })
  async getRecommendations(
    @User() user,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('minScore', new ParseFloatPipe({ optional: true })) minScore?: number,
    @Query('includeSpecialNeeds') includeSpecialNeeds?: string,
  ) {
    // Verificar que el usuario tenga preferencias completas
    const preferences = await this.userPreferencesRepository.findByUserIdOptional(user.id);

    if (!preferences || !preferences.isComplete) {
      return {
        needsOnboarding: true,
        message: 'Completa tu perfil de preferencias para recibir recomendaciones personalizadas',
        recommendations: [],
      };
    }

    const matches = await this.matchingService.findMatches({
      userId: user.id,
      limit: limit || 20,
      minScore: minScore || 0.3,
      includeSpecialNeeds: includeSpecialNeeds === 'true',
    });

    return {
      needsOnboarding: false,
      totalMatches: matches.length,
      recommendations: matches.map(match => ({
        animal: {
          id: match.animal.id,
          name: match.animal.name,
          type: match.animal.type,
          breed: match.animal.breed,
          age: match.animal.age,
          gender: match.animal.gender,
          description: match.animal.description,
          images: match.animal.images || [],
          weight: match.animal.weight,
          vaccinated: match.animal.vaccinated,
          sterilized: match.animal.sterilized,
          healthDetails: match.animal.healthDetails,
        },
        compatibility: match.compatibility,
        score: match.score,
        matchReasons: match.matchReasons,
        concerns: match.concerns,
      })),
    };
  }

  @Get('recommendations/:animalId/compatibility')
  @Roles(UserRole.ADOPTER)
  @ApiOperation({ summary: 'Obtener análisis detallado de compatibilidad con una mascota específica' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Análisis de compatibilidad generado',
  })
  async getCompatibilityAnalysis(
    @Param('animalId', ParseUUIDPipe) animalId: string,
    @User() user,
  ) {
    // Verificar que el usuario tenga preferencias completas
    const preferences = await this.userPreferencesRepository.findByUserIdOptional(user.id);

    if (!preferences || !preferences.isComplete) {
      return {
        needsOnboarding: true,
        message: 'Completa tu perfil de preferencias para ver el análisis de compatibilidad',
      };
    }

    const matches = await this.matchingService.findMatches({
      userId: user.id,
      limit: 100, // Buscar muchos para encontrar el específico
      minScore: 0, // Incluir todos los scores
      includeSpecialNeeds: true,
    });

    const specificMatch = matches.find(match => match.animal.id === animalId);

    if (!specificMatch) {
      return {
        found: false,
        message: 'No se pudo calcular la compatibilidad para esta mascota',
      };
    }

    return {
      found: true,
      compatibility: specificMatch.compatibility,
      score: specificMatch.score,
      matchReasons: specificMatch.matchReasons,
      concerns: specificMatch.concerns,
      recommendation: this.getRecommendationLevel(specificMatch.score),
    };
  }

  // === MÉTODOS AUXILIARES ===

  private getRecommendationLevel(score: number): string {
    if (score >= 0.8) return 'Excelente compatibilidad';
    if (score >= 0.6) return 'Buena compatibilidad';
    if (score >= 0.4) return 'Compatibilidad moderada';
    if (score >= 0.2) return 'Baja compatibilidad';
    return 'Compatibilidad muy baja';
  }
}