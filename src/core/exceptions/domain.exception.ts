export class DomainException extends Error {
  constructor(message: string) {
      super(message);
      this.name = this.constructor.name;
      Error.captureStackTrace(this, this.constructor);
  }
}

export class EntityNotFoundException extends DomainException {
  constructor(entity: string, id?: string | number) {
      super(`${entity} ${id ? `with ID: ${id}` : ''} not found`);
  }
}

export class BusinessRuleValidationException extends DomainException {
  constructor(message: string) {
      super(message);
  }
}

export class UnauthorizedDomainException extends DomainException {
  constructor(message: string = 'Not authorized to perform this action') {
      super(message);
  }
}

export class ForbiddenDomainException extends DomainException {
  constructor(message: string = 'You do not have permission to perform this action') {
      super(message);
  }
}

export class InvalidCredentialsException extends DomainException {
  constructor() {
      super('Invalid credentials');
  }
}

export class DuplicateEntityException extends DomainException {
  constructor(entity: string, field: string, value: string) {
      super(`A ${entity} with ${field}: ${value} already exists`);
  }
}
