export class DomainException extends Error {
    constructor(message: string) {
      super(message);
      this.name = this.constructor.name;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  export class EntityNotFoundException extends DomainException {
    constructor(entity: string, id?: string | number) {
      super(`${entity} ${id ? `con ID: ${id}` : ''} no encontrado`);
    }
  }
  
  export class BusinessRuleValidationException extends DomainException {
    constructor(message: string) {
      super(message);
    }
  }
  
  export class UnauthorizedDomainException extends DomainException {
    constructor(message: string = 'No autorizado para realizar esta acción') {
      super(message);
    }
  }
  
  export class ForbiddenDomainException extends DomainException {
    constructor(message: string = 'No tiene permisos para realizar esta acción') {
      super(message);
    }
  }
  
  export class InvalidCredentialsException extends DomainException {
    constructor() {
      super('Credenciales inválidas');
    }
  }
  
  export class DuplicateEntityException extends DomainException {
    constructor(entity: string, field: string, value: string) {
      super(`Ya existe un(a) ${entity} con ${field}: ${value}`);
    }
  }