import { v4 as uuidv4 } from 'uuid';
import { BusinessRuleValidationException } from '../../exceptions/domain.exception';
import { AnimalGender } from './value-objects/animal-gender.enum';
import { AnimalStatus } from './value-objects/animal-status';
import { AnimalType } from './value-objects/animal-type.enum';


export class AnimalEntity {
  private readonly id: string;
  private name: string;
  private type: AnimalType;
  private breed: string;
  private age: number;
  private gender: AnimalGender;
  private description: string;
  private ownerId: string;
  private images: any[];
  private status: AnimalStatus;
  private availableForAdoption: boolean;
  private weight?: number;
  private healthDetails?: string;
  private vaccinated: boolean;
  private sterilized: boolean;
  private createdAt: Date;
  private updatedAt: Date;

  constructor(
    id: string | null,
    name: string,
    type: AnimalType,
    breed: string,
    age: number,
    gender: AnimalGender,
    description: string,
    ownerId: string,
    images: string[] = [],
    status: AnimalStatus = AnimalStatus.AVAILABLE,
    availableForAdoption: boolean = true,
    weight?: number,
    healthDetails?: string,
    vaccinated: boolean = false,
    sterilized: boolean = false,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    // Validaciones de dominio
    this.validateName(name);
    this.validateAge(age);
    this.validateDescription(description);
    if (weight) this.validateWeight(weight);

    this.id = id || uuidv4();
    this.name = name;
    this.type = type;
    this.breed = breed;
    this.age = age;
    this.gender = gender;
    this.description = description;
    this.ownerId = ownerId;
    this.images = images;
    this.status = status;
    this.availableForAdoption = availableForAdoption;
    this.weight = weight;
    this.healthDetails = healthDetails;
    this.vaccinated = vaccinated;
    this.sterilized = sterilized;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getType(): AnimalType {
    return this.type;
  }

  getBreed(): string {
    return this.breed;
  }

  getAge(): number {
    return this.age;
  }

  getGender(): AnimalGender {
    return this.gender;
  }

  getDescription(): string {
    return this.description;
  }

  getOwnerId(): string {
    return this.ownerId;
  }

  getImages(): string[] {
    return [...this.images];
  }

  getStatus(): AnimalStatus {
    return this.status;
  }

  isAvailableForAdoption(): boolean {
    return this.availableForAdoption;
  }

  getWeight(): number | undefined {
    return this.weight;
  }

  getHealthDetails(): string | undefined {
    return this.healthDetails;
  }

  isVaccinated(): boolean {
    return this.vaccinated;
  }

  isSterilized(): boolean {
    return this.sterilized;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Setters
  updateInfo(
    name?: string,
    type?: AnimalType,
    breed?: string,
    age?: number,
    gender?: AnimalGender,
    description?: string,
    weight?: number,
    healthDetails?: string,
    vaccinated?: boolean,
    sterilized?: boolean,
  ): void {
    if (name) {
      this.validateName(name);
      this.name = name;
    }

    if (type) {
      this.type = type;
    }

    if (breed) {
      this.breed = breed;
    }

    if (age !== undefined) {
      this.validateAge(age);
      this.age = age;
    }

    if (gender) {
      this.gender = gender;
    }

    if (description) {
      this.validateDescription(description);
      this.description = description;
    }

    if (weight !== undefined) {
      this.validateWeight(weight);
      this.weight = weight;
    }

    if (healthDetails !== undefined) {
      this.healthDetails = healthDetails;
    }

    if (vaccinated !== undefined) {
      this.vaccinated = vaccinated;
    }

    if (sterilized !== undefined) {
      this.sterilized = sterilized;
    }

    this.updatedAt = new Date();
  }

  addImage(imageUrl: string): void {
    this.images.push(imageUrl);
    this.updatedAt = new Date();
  }

  removeImage(imageUrl: string): void {
    this.images = this.images.filter(img => img !== imageUrl);
    this.updatedAt = new Date();
  }

  setImages(images: string[]): void {
    this.images = images;
    this.updatedAt = new Date();
  }

  makeAvailableForAdoption(): void {
    this.availableForAdoption = true;
    this.status = AnimalStatus.AVAILABLE;
    this.updatedAt = new Date();
  }

  makeUnavailableForAdoption(): void {
    this.availableForAdoption = false;
    this.status = AnimalStatus.NOT_AVAILABLE;
    this.updatedAt = new Date();
  }

  markAsAdopted(): void {
    this.availableForAdoption = false;
    this.status = AnimalStatus.ADOPTED;
    this.updatedAt = new Date();
  }

  // Validadores
  private validateName(name: string): void {
    if (!name || name.trim().length < 2) {
      throw new BusinessRuleValidationException(
        'El nombre debe tener al menos 2 caracteres',
      );
    }

    if (name.trim().length > 50) {
      throw new BusinessRuleValidationException(
        'El nombre no puede exceder los 50 caracteres',
      );
    }
  }

  private validateAge(age: number): void {
    if (age < 0) {
      throw new BusinessRuleValidationException(
        'La edad no puede ser negativa',
      );
    }

    if (age > 100) {
      throw new BusinessRuleValidationException(
        'La edad parece ser demasiado alta',
      );
    }
  }

  private validateDescription(description: string): void {
    if (!description || description.trim().length < 10) {
      throw new BusinessRuleValidationException(
        'La descripción debe tener al menos 10 caracteres',
      );
    }

    if (description.trim().length > 1000) {
      throw new BusinessRuleValidationException(
        'La descripción no puede exceder los 1000 caracteres',
      );
    }
  }

  private validateWeight(weight: number): void {
    if (weight <= 0) {
      throw new BusinessRuleValidationException(
        'El peso debe ser mayor que 0',
      );
    }

    if (weight > 500) {
      throw new BusinessRuleValidationException(
        'El peso parece ser demasiado alto',
      );
    }
  }

  // Métodos de negocio
  canBeAdopted(): boolean {
    return this.isAvailableForAdoption() && this.status === AnimalStatus.AVAILABLE;
  }

  toObject() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      breed: this.breed,
      age: this.age,
      gender: this.gender,
      description: this.description,
      ownerId: this.ownerId,
      images: this.images,
      status: this.status,
      availableForAdoption: this.availableForAdoption,
      weight: this.weight,
      healthDetails: this.healthDetails,
      vaccinated: this.vaccinated,
      sterilized: this.sterilized,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}