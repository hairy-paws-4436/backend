export interface IBaseRepository<T> {
    findAll(filters?: any): Promise<T[]>;
    findById(id: string): Promise<T>;
    findOne(filters: any): Promise<T>;
    create(entity: T): Promise<T>;
    update(id: string, entity: Partial<T>): Promise<T>;
    delete(id: string): Promise<void>;
    exists(filters: any): Promise<boolean>;
  }
  
  // Interfaces específicas para cada entidad
  export interface IUserRepository extends IBaseRepository<any> {
    findByEmail(email: string): Promise<any>;
    findByPhoneNumber(phoneNumber: string): Promise<any>;
    updateTwoFactorSecret(userId: string, secret: string): Promise<void>;
    verifyUser(userId: string): Promise<void>;
  }
  
  export interface IAnimalRepository extends IBaseRepository<any> {
    findByOwnerId(ownerId: string): Promise<any[]>;
    findAvailableForAdoption(): Promise<any[]>;
  }
  
  export interface IAdoptionRepository extends IBaseRepository<any> {
    findByAnimalId(animalId: string): Promise<any[]>;
    findByAdopterId(adopterId: string): Promise<any[]>;
    findByOwnerId(ownerId: string): Promise<any[]>;
    updateStatus(id: string, status: string): Promise<void>;
  }
  
  export interface IOngRepository extends IBaseRepository<any> {
    findVerified(): Promise<any[]>;
    updateVerificationStatus(id: string, verified: boolean): Promise<void>;
    findByUserId(userId: string): Promise<any>;
  }
  
  export interface IEventRepository extends IBaseRepository<any> {
    findByOngId(ongId: string): Promise<any[]>;
    findActive(): Promise<any[]>;
  }
  
  export interface IDonationRepository extends IBaseRepository<any> {
    findByDonorId(donorId: string): Promise<any[]>;
    findByOngId(ongId: string): Promise<any[]>;
    updateConfirmationStatus(id: string, confirmed: boolean): Promise<void>;
  }
  
  export interface INotificationRepository extends IBaseRepository<any> {
    findByUserId(userId: string): Promise<any[]>;
    markAsRead(id: string): Promise<void>;
    markAllAsRead(userId: string): Promise<void>;
  }