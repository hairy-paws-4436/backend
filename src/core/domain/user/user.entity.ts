import { v4 as uuidv4 } from 'uuid';
import { BusinessRuleValidationException } from '../../exceptions/domain.exception';
import { UserRole } from './value-objects/user-role.enum';
import { UserStatus } from './value-objects/user-status';
import * as bcrypt from 'bcrypt';

export class UserEntity {
    async comparePassword(attempt: string): Promise<boolean> {
        return bcrypt.compare(attempt, this.password);
      }
   
  private readonly id: string;
  private email: string;
  private password: string;
  private firstName: string;
  private lastName: string;
  private phoneNumber: string;
  private role: UserRole;
  private status: UserStatus;
  private verified: boolean;
  private address?: string;
  private profileImageUrl?: string;
  private twoFactorSecret?: string;
  private twoFactorEnabled: boolean;
  private createdAt: Date;
  private updatedAt: Date;

  constructor(
    id: string | null,
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phoneNumber: string,
    role: UserRole = UserRole.ADOPTER,
    status: UserStatus = UserStatus.ACTIVE,
    verified: boolean = false,
    address?: string,
    profileImageUrl?: string,
    twoFactorSecret?: string,
    twoFactorEnabled: boolean = false,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    // Validaciones de dominio
    this.validateEmail(email);
    this.validatePhoneNumber(phoneNumber);
    this.validateName(firstName, 'Nombre');
    this.validateName(lastName, 'Apellido');

    this.id = id || uuidv4();
    this.email = email.toLowerCase();
    this.password = password;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phoneNumber = phoneNumber;
    this.role = role;
    this.status = status;
    this.verified = verified;
    this.address = address;
    this.profileImageUrl = profileImageUrl;
    this.twoFactorSecret = twoFactorSecret;
    this.twoFactorEnabled = twoFactorEnabled;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getEmail(): string {
    return this.email;
  }

  getPassword(): string {
    return this.password;
  }

  getFirstName(): string {
    return this.firstName;
  }

  getLastName(): string {
    return this.lastName;
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  getPhoneNumber(): string {
    return this.phoneNumber;
  }

  getRole(): UserRole {
    return this.role;
  }

  getStatus(): UserStatus {
    return this.status;
  }

  isVerified(): boolean {
    return this.verified;
  }

  getAddress(): string | undefined {
    return this.address;
  }

  getProfileImageUrl(): string | undefined {
    return this.profileImageUrl;
  }

  getTwoFactorSecret(): string | undefined {
    return this.twoFactorSecret;
  }

  isTwoFactorEnabled(): boolean {
    return this.twoFactorEnabled;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Setters
  updateProfile(
    firstName?: string,
    lastName?: string,
    phoneNumber?: string,
    address?: string,
  ): void {
    if (firstName) {
      this.validateName(firstName, 'Nombre');
      this.firstName = firstName;
    }

    if (lastName) {
      this.validateName(lastName, 'Apellido');
      this.lastName = lastName;
    }

    if (phoneNumber) {
      this.validatePhoneNumber(phoneNumber);
      this.phoneNumber = phoneNumber;
    }

    if (address !== undefined) {
      this.address = address;
    }

    this.updatedAt = new Date();
  }

  updateEmail(email: string): void {
    this.validateEmail(email);
    this.email = email.toLowerCase();
    this.updatedAt = new Date();
  }

  updatePassword(password: string): void {
    this.password = password;
    this.updatedAt = new Date();
  }

  updateProfileImage(imageUrl: string): void {
    this.profileImageUrl = imageUrl;
    this.updatedAt = new Date();
  }

  setTwoFactorSecret(secret: string): void {
    this.twoFactorSecret = secret;
    this.updatedAt = new Date();
  }

  enableTwoFactor(): void {
    this.twoFactorEnabled = true;
    this.updatedAt = new Date();
  }

  disableTwoFactor(): void {
    this.twoFactorEnabled = false;
    this.twoFactorSecret = undefined;
    this.updatedAt = new Date();
  }

  verify(): void {
    this.verified = true;
    this.updatedAt = new Date();
  }

  changeRole(role: UserRole): void {
    this.role = role;
    this.updatedAt = new Date();
  }

  activate(): void {
    this.status = UserStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.status = UserStatus.INACTIVE;
    this.updatedAt = new Date();
  }

  // Validadores
  private validateEmail(email: string): void {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
      throw new BusinessRuleValidationException(
        'El formato del correo electrónico no es válido',
      );
    }
  }

  private validatePhoneNumber(phoneNumber: string): void {
    // Validación para número telefónico peruano (9 dígitos)
    const phoneRegex = /^9\d{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      throw new BusinessRuleValidationException(
        'El número telefónico debe comenzar con 9 y tener 9 dígitos en total (formato peruano)',
      );
    }
  }

  private validateName(name: string, field: string): void {
    if (!name || name.trim().length < 2) {
      throw new BusinessRuleValidationException(
        `El campo ${field} debe tener al menos 2 caracteres`,
      );
    }

    if (name.trim().length > 50) {
      throw new BusinessRuleValidationException(
        `El campo ${field} no puede exceder los 50 caracteres`,
      );
    }
  }

  

  // Métodos de negocio
  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  canLogin(): boolean {
    return this.isActive();
  }

  toObject() {
    return {
      id: this.id,
      email: this.email,
      password: this.password,
      firstName: this.firstName,
      lastName: this.lastName,
      phoneNumber: this.phoneNumber,
      role: this.role,
      status: this.status,
      verified: this.verified,
      address: this.address,
      profileImageUrl: this.profileImageUrl,
      twoFactorSecret: this.twoFactorSecret,
      twoFactorEnabled: this.twoFactorEnabled,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}