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
  private identityDocument: string;
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
    identityDocument?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.validateEmail(email);
    this.validatePhoneNumber(phoneNumber);
    this.validateName(firstName, 'First Name');
    this.validateName(lastName, 'Last Name');

    if (identityDocument) {
      this.validateIdentityDocument(identityDocument);
    }

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

  getIdentityDocument(): string | undefined {
    return this.identityDocument;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  updateProfile(
    firstName?: string,
    lastName?: string,
    phoneNumber?: string,
    address?: string,
  ): void {
    if (firstName) {
      this.validateName(firstName, 'First Name');
      this.firstName = firstName;
    }

    if (lastName) {
      this.validateName(lastName, 'Last Name');
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

  private validateEmail(email: string): void {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
      throw new BusinessRuleValidationException('The email format is invalid');
    }
  }

  private validatePhoneNumber(phoneNumber: string): void {
    const phoneRegex = /^9\d{8}$/;
    if (!phoneRegex.test(phoneNumber)) {
      throw new BusinessRuleValidationException(
        'The phone number must start with 9 and have 9 digits (Peruvian format)',
      );
    }
  }

  private validateName(name: string, field: string): void {
    if (!name || name.trim().length < 2) {
      throw new BusinessRuleValidationException(
        `The field ${field} must have at least 2 characters`,
      );
    }

    if (name.trim().length > 50) {
      throw new BusinessRuleValidationException(
        `The field ${field} cannot exceed 50 characters`,
      );
    }
  }

  updateIdentityDocument(identityDocument: string): void {
    this.validateIdentityDocument(identityDocument);
    this.identityDocument = identityDocument;
    this.updatedAt = new Date();
  }

  private validateIdentityDocument(identityDocument: string): void {
    const dniRegex = /^\d{8}$/;
    if (!dniRegex.test(identityDocument)) {
      throw new BusinessRuleValidationException(
        'The identity document must have 8 digits (Peruvian DNI format)',
      );
    }
  }

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
      identityDocument: this.identityDocument,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
