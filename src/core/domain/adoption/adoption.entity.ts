import { v4 as uuidv4 } from 'uuid';
import { BusinessRuleValidationException } from '../../exceptions/domain.exception';
import { AdoptionStatus } from './value-objects/adoption-status.enum';
import { AdoptionType } from './value-objects/adoption-type.enum';

export class AdoptionEntity {
  private readonly id: string;
  private animalId: string;
  private ownerId: string;
  private adopterId: string;
  private type: AdoptionType;
  private status: AdoptionStatus;
  private requestDate: Date;
  private approvalDate?: Date;
  private rejectionDate?: Date;
  private visitDate?: Date;
  private notes?: string;
  private createdAt: Date;
  private updatedAt: Date;

  constructor(
    id: string | null,
    animalId: string,
    ownerId: string,
    adopterId: string,
    type: AdoptionType,
    status: AdoptionStatus = AdoptionStatus.PENDING,
    requestDate?: Date,
    approvalDate?: Date,
    rejectionDate?: Date,
    visitDate?: Date,
    notes?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    if (visitDate && type !== AdoptionType.VISIT) {
      throw new BusinessRuleValidationException(
        'Visit date only applies to visit-type requests',
      );
    }

    this.id = id || uuidv4();
    this.animalId = animalId;
    this.ownerId = ownerId;
    this.adopterId = adopterId;
    this.type = type;
    this.status = status;
    this.requestDate = requestDate || new Date();
    this.approvalDate = approvalDate;
    this.rejectionDate = rejectionDate;
    this.visitDate = visitDate;
    this.notes = notes;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  getId(): string {
    return this.id;
  }

  getAnimalId(): string {
    return this.animalId;
  }

  getOwnerId(): string {
    return this.ownerId;
  }

  getAdopterId(): string {
    return this.adopterId;
  }

  getType(): AdoptionType {
    return this.type;
  }

  getStatus(): AdoptionStatus {
    return this.status;
  }

  getRequestDate(): Date {
    return this.requestDate;
  }

  getApprovalDate(): Date | undefined {
    return this.approvalDate;
  }

  getRejectionDate(): Date | undefined {
    return this.rejectionDate;
  }

  getVisitDate(): Date | undefined {
    return this.visitDate;
  }

  getNotes(): string | undefined {
    return this.notes;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  approve(): void {
    if (this.status !== AdoptionStatus.PENDING) {
      throw new BusinessRuleValidationException(
        'Only pending requests can be approved',
      );
    }

    this.status = AdoptionStatus.APPROVED;
    this.approvalDate = new Date();
    this.updatedAt = new Date();
  }

  reject(notes?: string): void {
    if (this.status !== AdoptionStatus.PENDING) {
      throw new BusinessRuleValidationException(
        'Only pending requests can be rejected',
      );
    }

    this.status = AdoptionStatus.REJECTED;
    this.rejectionDate = new Date();
    if (notes) {
      this.notes = notes;
    }
    this.updatedAt = new Date();
  }

  cancel(): void {
    if (this.status !== AdoptionStatus.PENDING && this.status !== AdoptionStatus.APPROVED) {
      throw new BusinessRuleValidationException(
        'Only pending or approved requests can be cancelled',
      );
    }

    this.status = AdoptionStatus.CANCELLED;
    this.updatedAt = new Date();
  }

  complete(): void {
    if (this.status !== AdoptionStatus.APPROVED) {
      throw new BusinessRuleValidationException(
        'Only approved requests can be completed',
      );
    }

    this.status = AdoptionStatus.COMPLETED;
    this.updatedAt = new Date();
  }

  updateVisitDate(visitDate: Date): void {
    if (this.type !== AdoptionType.VISIT) {
      throw new BusinessRuleValidationException(
        'Visit date can only be updated for visit-type requests',
      );
    }

    this.visitDate = visitDate;
    this.updatedAt = new Date();
  }

  updateNotes(notes: string): void {
    this.notes = notes;
    this.updatedAt = new Date();
  }

  isPending(): boolean {
    return this.status === AdoptionStatus.PENDING;
  }

  isApproved(): boolean {
    return this.status === AdoptionStatus.APPROVED;
  }

  isRejected(): boolean {
    return this.status === AdoptionStatus.REJECTED;
  }

  isCancelled(): boolean {
    return this.status === AdoptionStatus.CANCELLED;
  }

  isCompleted(): boolean {
    return this.status === AdoptionStatus.COMPLETED;
  }

  isVisit(): boolean {
    return this.type === AdoptionType.VISIT;
  }

  isAdoption(): boolean {
    return this.type === AdoptionType.ADOPTION;
  }

  toObject() {
    return {
      id: this.id,
      animalId: this.animalId,
      ownerId: this.ownerId,
      adopterId: this.adopterId,
      type: this.type,
      status: this.status,
      requestDate: this.requestDate,
      approvalDate: this.approvalDate,
      rejectionDate: this.rejectionDate,
      visitDate: this.visitDate,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}