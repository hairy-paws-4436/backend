import { UserStatus } from 'src/core/domain/user/value-objects/user-status';
import { UserEntity } from '../../../../../src/core/domain/user/user.entity';
import { UserRole } from '../../../../../src/core/domain/user/value-objects/user-role.enum';

import { BusinessRuleValidationException } from '../../../../../src/core/exceptions/domain.exception';

describe('UserEntity', () => {
  describe('constructor', () => {
    it('should create a valid user entity', () => {
      // Arrange
      const userData = {
        id: 'test-id',
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '987654321',
        role: UserRole.ADOPTER,
      };

      // Act
      const user = new UserEntity(
        userData.id,
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
        userData.phoneNumber,
        userData.role,
      );

      // Assert
      expect(user.getId()).toBe(userData.id);
      expect(user.getEmail()).toBe(userData.email.toLowerCase());
      expect(user.getPassword()).toBe(userData.password);
      expect(user.getFirstName()).toBe(userData.firstName);
      expect(user.getLastName()).toBe(userData.lastName);
      expect(user.getPhoneNumber()).toBe(userData.phoneNumber);
      expect(user.getRole()).toBe(userData.role);
      expect(user.getStatus()).toBe(UserStatus.ACTIVE);
      expect(user.isVerified()).toBe(false);
      expect(user.isTwoFactorEnabled()).toBe(false);
    });

    it('should create a user with default role as ADOPTER when role is not provided', () => {
      // Arrange & Act
      const user = new UserEntity(
        'test-id',
        'test@example.com',
        'Password123',
        'John',
        'Doe',
        '987654321',
      );

      // Assert
      expect(user.getRole()).toBe(UserRole.ADOPTER);
    });

    it('should create a user with id when id is not provided', () => {
      // Arrange & Act
      const user = new UserEntity(
        null,
        'test@example.com',
        'Password123',
        'John',
        'Doe',
        '987654321',
      );

      // Assert
      expect(user.getId()).toBeDefined();
    });

    it('should validate email format and throw error for invalid email', () => {
      // Arrange & Act & Assert
      expect(() => {
        new UserEntity(
          'test-id',
          'invalid-email',
          'Password123',
          'John',
          'Doe',
          '987654321',
        );
      }).toThrow(BusinessRuleValidationException);
    });

    it('should validate phone number format and throw error for invalid Peruvian phone number', () => {
      // Arrange & Act & Assert
      expect(() => {
        new UserEntity(
          'test-id',
          'test@example.com',
          'Password123',
          'John',
          'Doe',
          '12345678', // No inicia con 9 o no tiene 9 dígitos
        );
      }).toThrow(BusinessRuleValidationException);
    });

    it('should validate name length and throw error for short names', () => {
      // Arrange & Act & Assert
      expect(() => {
        new UserEntity(
          'test-id',
          'test@example.com',
          'Password123',
          'J', // Nombre muy corto
          'Doe',
          '987654321',
        );
      }).toThrow(BusinessRuleValidationException);
    });
  });

  describe('methods', () => {
    let user: UserEntity;

    beforeEach(() => {
      user = new UserEntity(
        'test-id',
        'test@example.com',
        'Password123',
        'John',
        'Doe',
        '987654321',
        UserRole.ADOPTER,
      );
    });

    it('should update profile correctly', () => {
      // Arrange
      const newFirstName = 'Jane';
      const newLastName = 'Smith';
      const newPhoneNumber = '987654322';
      const newAddress = 'New Address';

      // Act
      user.updateProfile(newFirstName, newLastName, newPhoneNumber, newAddress);

      // Assert
      expect(user.getFirstName()).toBe(newFirstName);
      expect(user.getLastName()).toBe(newLastName);
      expect(user.getPhoneNumber()).toBe(newPhoneNumber);
      expect(user.getAddress()).toBe(newAddress);
    });

    it('should update email correctly', () => {
      // Arrange
      const newEmail = 'new-email@example.com';

      // Act
      user.updateEmail(newEmail);

      // Assert
      expect(user.getEmail()).toBe(newEmail.toLowerCase());
    });

    it('should update password correctly', () => {
      // Arrange
      const newPassword = 'NewPassword123';

      // Act
      user.updatePassword(newPassword);

      // Assert
      expect(user.getPassword()).toBe(newPassword);
    });

    it('should verify user correctly', () => {
      // Act
      user.verify();

      // Assert
      expect(user.isVerified()).toBe(true);
    });

    it('should change role correctly', () => {
      // Arrange
      const newRole = UserRole.OWNER;

      // Act
      user.changeRole(newRole);

      // Assert
      expect(user.getRole()).toBe(newRole);
    });

    it('should activate user correctly', () => {
      // Arrange
      user.deactivate(); // First deactivate to test activation

      // Act
      user.activate();

      // Assert
      expect(user.getStatus()).toBe(UserStatus.ACTIVE);
      expect(user.isActive()).toBe(true);
    });

    it('should deactivate user correctly', () => {
      // Act
      user.deactivate();

      // Assert
      expect(user.getStatus()).toBe(UserStatus.INACTIVE);
      expect(user.isActive()).toBe(false);
    });

    it('should enable two factor authentication correctly', () => {
      // Arrange
      const secret = 'two-factor-secret';
      
      // Act
      user.setTwoFactorSecret(secret);
      user.enableTwoFactor();

      // Assert
      expect(user.getTwoFactorSecret()).toBe(secret);
      expect(user.isTwoFactorEnabled()).toBe(true);
    });

    it('should disable two factor authentication correctly', () => {
      // Arrange
      const secret = 'two-factor-secret';
      user.setTwoFactorSecret(secret);
      user.enableTwoFactor();

      // Act
      user.disableTwoFactor();

      // Assert
      expect(user.getTwoFactorSecret()).toBeUndefined();
      expect(user.isTwoFactorEnabled()).toBe(false);
    });

    it('should return full name correctly', () => {
      // Act & Assert
      expect(user.getFullName()).toBe('John Doe');
    });

    it('should convert to object correctly', () => {
      // Act
      const userObject = user.toObject();

      // Assert
      expect(userObject).toEqual({
        id: 'test-id',
        email: 'test@example.com',
        password: 'Password123',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '987654321',
        role: UserRole.ADOPTER,
        status: UserStatus.ACTIVE,
        verified: false,
        address: undefined,
        profileImageUrl: undefined,
        twoFactorSecret: undefined,
        twoFactorEnabled: false,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });
});