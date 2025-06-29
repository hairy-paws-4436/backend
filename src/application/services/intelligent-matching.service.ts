import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPreferencesEntity, ExperienceLevel, HousingType, ActivityLevel, TimeAvailability, FamilyComposition } from '../../infrastructure/database/mysql/entities/user-preferences.entity';
import { AnimalProfileEntity, EnergyLevel, SocialLevel, TrainingLevel, CareLevel } from '../../infrastructure/database/mysql/entities/animal-profile.entity';

import { AnimalRepository } from '../../infrastructure/database/mysql/repositories/animal.repository';
import { AnimalEntity } from '../../core/domain/animal/animal.entity';



export interface MatchResult {
  animal: any; // Cambio temporal para evitar problemas de tipos
  score: number;
  matchReasons: string[];
  concerns: string[];
  compatibility: {
    overall: number;
    personality: number;
    lifestyle: number;
    experience: number;
    practical: number;
  };
}

export interface MatchingCriteria {
  userId: string;
  limit?: number;
  minScore?: number;
  includeSpecialNeeds?: boolean;
}

@Injectable()
export class IntelligentMatchingService {
  private readonly logger = new Logger(IntelligentMatchingService.name);

  constructor(
    @InjectRepository(UserPreferencesEntity)
    private readonly userPreferencesRepository: Repository<UserPreferencesEntity>,
    @InjectRepository(AnimalProfileEntity)
    private readonly animalProfileRepository: Repository<AnimalProfileEntity>,
    private readonly animalRepository: AnimalRepository, // Usar el repositorio existente
  ) {}

  async findMatches(criteria: MatchingCriteria): Promise<MatchResult[]> {
    try {
      // Obtener preferencias del usuario
      const userPreferences = await this.userPreferencesRepository.findOne({
        where: { userId: criteria.userId },
      });

      if (!userPreferences || !userPreferences.isComplete) {
        throw new Error('User preferences not found or incomplete');
      }

      // Obtener animales disponibles usando el repositorio existente
      const availableAnimals = await this.animalRepository.findAll({
        availableForAdoption: true,
        status: 'available'
      });

      this.logger.log(`Found ${availableAnimals.length} available animals for matching`);

      // Calcular compatibilidad para cada animal
      const matches: MatchResult[] = [];

      for (const animal of availableAnimals) {
        const animalProfile = await this.animalProfileRepository.findOne({
          where: { animalId: animal.getId() },
        });

        const matchResult = this.calculateCompatibility(userPreferences, animal, animalProfile);

        // Aplicar filtros mínimos
        if (matchResult.score >= (criteria.minScore || 0.3)) {
          if (criteria.includeSpecialNeeds || !this.hasSpecialNeeds(animal, animalProfile)) {
            matches.push(matchResult);
          }
        }
      }

      // Ordenar por score descendente y limitar resultados
      const sortedMatches = matches
        .sort((a, b) => b.score - a.score)
        .slice(0, criteria.limit || 20);

      this.logger.log(`Generated ${sortedMatches.length} matches for user ${criteria.userId}`);

      return sortedMatches;
    } catch (error) {
      this.logger.error(`Error finding matches: ${error.message}`, error.stack);
      throw error;
    }
  }

  private calculateCompatibility(
    preferences: UserPreferencesEntity,
    animal: any, // Usar any temporalmente
    profile: AnimalProfileEntity | null,
  ): MatchResult {
    const scores = {
      personality: 0,
      lifestyle: 0,
      experience: 0,
      practical: 0,
    };

    const matchReasons: string[] = [];
    const concerns: string[] = [];

    // 1. COMPATIBILIDAD DE PERSONALIDAD (25%)
    scores.personality = this.calculatePersonalityMatch(preferences, animal, profile, matchReasons, concerns);

    // 2. COMPATIBILIDAD DE ESTILO DE VIDA (30%)
    scores.lifestyle = this.calculateLifestyleMatch(preferences, animal, profile, matchReasons, concerns);

    // 3. COMPATIBILIDAD DE EXPERIENCIA (25%)
    scores.experience = this.calculateExperienceMatch(preferences, animal, profile, matchReasons, concerns);

    // 4. COMPATIBILIDAD PRÁCTICA (20%)
    scores.practical = this.calculatePracticalMatch(preferences, animal, profile, matchReasons, concerns);

    // Calcular score general ponderado
    const overallScore =
      scores.personality * 0.25 +
      scores.lifestyle * 0.30 +
      scores.experience * 0.25 +
      scores.practical * 0.20;

    return {
      animal: {
        id: animal.getId(),
        name: animal.getName(),
        type: animal.getType(),
        breed: animal.getBreed(),
        age: animal.getAge(),
        gender: animal.getGender(),
        description: animal.getDescription(),
        images: animal.getImages() || [],
        weight: animal.getWeight(),
        vaccinated: animal.isVaccinated(),
        sterilized: animal.isSterilized(),
        healthDetails: animal.getHealthDetails(),
      },
      score: Math.round(overallScore * 100) / 100,
      matchReasons,
      concerns,
      compatibility: {
        overall: Math.round(overallScore * 100),
        personality: Math.round(scores.personality * 100),
        lifestyle: Math.round(scores.lifestyle * 100),
        experience: Math.round(scores.experience * 100),
        practical: Math.round(scores.practical * 100),
      },
    };
  }

  private calculatePersonalityMatch(
    preferences: UserPreferencesEntity,
    animal: any,
    profile: AnimalProfileEntity | null,
    matchReasons: string[],
    concerns: string[],
  ): number {
    let score = 0.5; // Score base

    if (!profile) return score;

    // Nivel de energía vs actividad preferida
    const energyCompatibility = this.getEnergyCompatibility(preferences.preferredActivityLevel, profile.energyLevel);
    score += energyCompatibility * 0.3;

    if (energyCompatibility > 0.7) {
      matchReasons.push(`Nivel de energía compatible (${profile.energyLevel})`);
    } else if (energyCompatibility < 0.3) {
      concerns.push(`Diferencia en nivel de energía requerida`);
    }

    // Sociabilidad
    if (preferences.familyComposition === FamilyComposition.FAMILY_YOUNG_KIDS && profile.goodWithKids === false) {
      score -= 0.4;
      concerns.push('No recomendado para familias con niños pequeños');
    } else if (profile.goodWithKids === true && preferences.familyComposition.includes('family')) {
      score += 0.2;
      matchReasons.push('Excelente con niños');
    }

    // Otras mascotas
    if (preferences.hasOtherPets && profile.goodWithOtherPets === false) {
      score -= 0.3;
      concerns.push('Puede tener problemas con otras mascotas');
    } else if (preferences.hasOtherPets && profile.goodWithOtherPets === true) {
      score += 0.2;
      matchReasons.push('Se lleva bien con otras mascotas');
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculateLifestyleMatch(
    preferences: UserPreferencesEntity,
    animal: any,
    profile: AnimalProfileEntity | null,
    matchReasons: string[],
    concerns: string[],
  ): number {
    let score = 0.5;

    // Tipo de vivienda
    const housingCompatibility = this.getHousingCompatibility(preferences.housingType, profile);
    score += housingCompatibility * 0.4;

    if (housingCompatibility > 0.8) {
      matchReasons.push('Tipo de vivienda ideal para esta mascota');
    } else if (housingCompatibility < 0.4) {
      concerns.push('Tipo de vivienda no es la ideal');
    }

    // Tiempo disponible vs necesidades de cuidado
    const timeCompatibility = this.getTimeCompatibility(preferences.timeAvailability, profile);
    score += timeCompatibility * 0.3;

    // Tamaño del animal vs preferencias
    const animalWeight = animal.getWeight && animal.getWeight();
    if (preferences.minSize && animalWeight && animalWeight < preferences.minSize) {
      score -= 0.1;
    }
    if (preferences.maxSize && animalWeight && animalWeight > preferences.maxSize) {
      score -= 0.2;
      concerns.push('Tamaño mayor al preferido');
    }

    // Edad del animal vs preferencias
    const animalAge = animal.getAge && animal.getAge();
    if (preferences.minAge && animalAge && animalAge < preferences.minAge) {
      score -= 0.1;
    }
    if (preferences.maxAge && animalAge && animalAge > preferences.maxAge) {
      score -= 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculateExperienceMatch(
    preferences: UserPreferencesEntity,
    animal: any,
    profile: AnimalProfileEntity | null,
    matchReasons: string[],
    concerns: string[],
  ): number {
    let score = 0.5;

    if (!profile) return score;

    // Experiencia del usuario vs dificultad de la mascota
    const experienceScore = this.getExperienceScore(preferences.experienceLevel);
    const difficultyScore = this.getDifficultyScore(animal, profile);

    if (experienceScore >= difficultyScore) {
      score += 0.4;
      if (experienceScore > difficultyScore + 0.3) {
        matchReasons.push('Tu experiencia es perfecta para esta mascota');
      }
    } else {
      const gap = difficultyScore - experienceScore;
      score -= gap * 0.6;
      if (gap > 0.4) {
        concerns.push('Esta mascota puede requerir más experiencia');
      }
    }

    // Preferencia por mascotas entrenadas
    if (preferences.prefersTrained && profile.trainingLevel !== TrainingLevel.UNTRAINED) {
      score += 0.2;
      matchReasons.push('Mascota con entrenamiento básico/avanzado');
    } else if (preferences.prefersTrained && profile.trainingLevel === TrainingLevel.UNTRAINED) {
      score -= 0.1;
    }

    // Experiencia previa con el tipo de animal
    const animalType = animal.getType && animal.getType();
    if (preferences.previousPetTypes?.includes(animalType)) {
      score += 0.2;
      matchReasons.push(`Tienes experiencia previa con ${animalType}`);
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculatePracticalMatch(
    preferences: UserPreferencesEntity,
    animal: any,
    profile: AnimalProfileEntity | null,
    matchReasons: string[],
    concerns: string[],
  ): number {
    let score = 0.5;

    // Tipo de animal preferido
    const animalType = animal.getType && animal.getType();
    if (preferences.preferredAnimalTypes.includes(animalType)) {
      score += 0.3;
      matchReasons.push(`Coincide con tu preferencia por ${animalType}`);
    }

    // Género preferido
    const animalGender = animal.getGender && animal.getGender();
    if (preferences.preferredGenders?.length && preferences.preferredGenders.includes(animalGender)) {
      score += 0.1;
    }

    // Estado de vacunación
    const isVaccinated = animal.isVaccinated && animal.isVaccinated();
    if (preferences.prefersVaccinated && isVaccinated) {
      score += 0.1;
      matchReasons.push('Vacunas al día');
    } else if (preferences.prefersVaccinated && !isVaccinated) {
      score -= 0.1;
      concerns.push('Necesita completar vacunas');
    }

    // Estado de esterilización
    const isSterilized = animal.isSterilized && animal.isSterilized();
    if (preferences.prefersSterilized && isSterilized) {
      score += 0.1;
      matchReasons.push('Esterilizado');
    } else if (preferences.prefersSterilized && !isSterilized) {
      score -= 0.1;
      concerns.push('Necesita esterilización');
    }

    // Necesidades especiales
    if (!preferences.acceptsSpecialNeeds && this.hasSpecialNeeds(animal, profile)) {
      score -= 0.3;
      concerns.push('Requiere cuidados especiales');
    }

    return Math.max(0, Math.min(1, score));
  }

  // Métodos auxiliares para cálculos específicos
  private getEnergyCompatibility(preferredActivity: ActivityLevel, animalEnergy: EnergyLevel): number {
    const activityMap = {
      [ActivityLevel.LOW]: 1,
      [ActivityLevel.MODERATE]: 2,
      [ActivityLevel.HIGH]: 3,
      [ActivityLevel.VERY_HIGH]: 4,
    };

    const energyMap = {
      [EnergyLevel.VERY_LOW]: 1,
      [EnergyLevel.LOW]: 2,
      [EnergyLevel.MODERATE]: 3,
      [EnergyLevel.HIGH]: 4,
      [EnergyLevel.VERY_HIGH]: 5,
    };

    const userLevel = activityMap[preferredActivity] || 2;
    const animalLevel = energyMap[animalEnergy] || 3;
    const difference = Math.abs(userLevel - animalLevel);

    return Math.max(0, 1 - (difference * 0.25));
  }

  private getHousingCompatibility(housingType: HousingType, profile: AnimalProfileEntity | null): number {
    if (!profile) return 0.5;

    const housingScores = {
      [HousingType.APARTMENT]: profile.apartmentSuitable ? 1 : 0.3,
      [HousingType.HOUSE_NO_YARD]: 0.7,
      [HousingType.HOUSE_SMALL_YARD]: 0.8,
      [HousingType.HOUSE_LARGE_YARD]: 1,
      [HousingType.FARM]: 1,
    };

    return housingScores[housingType] || 0.5;
  }

  private getTimeCompatibility(timeAvailability: TimeAvailability, profile: AnimalProfileEntity | null): number {
    if (!profile) return 0.5;

    const timeScores = {
      [TimeAvailability.MINIMAL]: profile.careLevel === CareLevel.LOW ? 0.8 : 0.2,
      [TimeAvailability.LIMITED]: profile.careLevel === CareLevel.MODERATE ? 0.8 : 0.6,
      [TimeAvailability.MODERATE]: 0.8,
      [TimeAvailability.EXTENSIVE]: 1,
    };

    return timeScores[timeAvailability] || 0.5;
  }

  private getExperienceScore(experienceLevel: ExperienceLevel): number {
    const scores = {
      [ExperienceLevel.FIRST_TIME]: 0.2,
      [ExperienceLevel.SOME_EXPERIENCE]: 0.5,
      [ExperienceLevel.EXPERIENCED]: 0.8,
      [ExperienceLevel.EXPERT]: 1.0,
    };

    return scores[experienceLevel] || 0.2;
  }

  private getDifficultyScore(animal: AnimalEntity, profile: AnimalProfileEntity | null): number {
    if (!profile) return 0.5;

    let difficulty = 0.3; // Base difficulty

    // Aumentar dificultad por comportamientos problemáticos
    if (profile.destructiveBehavior) difficulty += 0.2;
    if (profile.separationAnxiety) difficulty += 0.2;
    if (profile.escapeTendency) difficulty += 0.15;
    if (profile.noiseSensitivity) difficulty += 0.1;

    // Aumentar por nivel de cuidado
    if (profile.careLevel === CareLevel.HIGH) difficulty += 0.2;
    if (profile.careLevel === CareLevel.SPECIAL_NEEDS) difficulty += 0.4;

    // Reducir dificultad por entrenamiento
    if (profile.trainingLevel === TrainingLevel.ADVANCED) difficulty -= 0.1;
    if (profile.trainingLevel === TrainingLevel.PROFESSIONAL) difficulty -= 0.2;
    if (profile.houseTrained) difficulty -= 0.1;

    return Math.max(0.1, Math.min(1, difficulty));
  }

  private hasSpecialNeeds(animal: AnimalEntity, profile: AnimalProfileEntity | null): boolean {
    if (!profile) return false;

    return (
      profile.careLevel === CareLevel.SPECIAL_NEEDS ||
      profile.specialDiet ||
      (profile.chronicConditions && profile.chronicConditions.length > 0) ||
      (profile.medications && profile.medications.length > 0) ||
      profile.destructiveBehavior ||
      profile.separationAnxiety
    );
  }
}