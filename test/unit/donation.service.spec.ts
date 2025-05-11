import { Test, TestingModule } from '@nestjs/testing';
import { DonationService } from '../../src/application/services/donation.service';
import { DonationStatus } from '../../src/core/domain/donation/value-objects/donation-status.enum';
import { DonationType } from '../../src/core/domain/donation/value-objects/donation-type.enum';
import { DonationItemRepository } from '../../src/infrastructure/database/mysql/repositories/donation-item.repository';
import { DonationRepository } from '../../src/infrastructure/database/mysql/repositories/donation.repository';
import { OngRepository } from '../../src/infrastructure/database/mysql/repositories/ong.repository';
import { S3Service } from '../../src/infrastructure/services/aws/s3.service';
import { NotificationService } from '../../src/infrastructure/services/notification/notification.service';
import { DonationEntity } from '../../src/infrastructure/database/mysql/entities/donation.entity';
import { CreateDonationDto } from 'src/presentation/dtos/requests/create-donation.dto';
import { NotificationType } from '../../src/core/domain/notification/value-objects/notification-type.enum';
import { BusinessRuleValidationException } from '../../src/core/exceptions/domain.exception';

describe('DonationService', () => {
  let service: DonationService;
  let donationRepository: DonationRepository;
  let donationItemRepository: DonationItemRepository;
  let s3Service: S3Service;
  let notificationService: NotificationService;
  let ongRepository: OngRepository;

  const mockDonation = {
    id: 'donation1',
    donorId: 'donor1',
    ongId: 'ong1',
    type: DonationType.MONEY,
    status: DonationStatus.PENDING,
    amount: 100,
    transactionId: 'transaction1',
    notes: 'Test donation',
    receiptUrl: 'https://example.com/receipt.jpg',
    getStatus: jest.fn().mockReturnValue(DonationStatus.PENDING),
    isPending: jest.fn().mockReturnValue(true),
    confirm: jest.fn(),
    cancel: jest.fn(),
    toObject: jest.fn().mockReturnValue({
      id: 'donation1',
      donorId: 'donor1',
      ongId: 'ong1',
      type: DonationType.MONEY,
      status: DonationStatus.PENDING,
      amount: 100,
      transactionId: 'transaction1',
      notes: 'Test donation',
      receiptUrl: 'https://example.com/receipt.jpg',
    }),
  } as unknown as DonationEntity;

  const mockConfirmedDonation = {
    ...mockDonation,
    status: DonationStatus.CONFIRMED,
    isPending: jest.fn().mockReturnValue(false),
  } as unknown as DonationEntity;

  const mockOng = {
    id: 'ong1',
    userId: 'ongUser1',
    name: 'Test ONG',
  };

  const mockReceipt: Express.Multer.File = {
    fieldname: 'receipt',
    originalname: 'receipt.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test'),
    size: 4,
    destination: '',
    filename: '',
    path: '',
    stream: null
  } as Express.Multer.File;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DonationService,
        {
          provide: DonationRepository,
          useValue: {
            create: jest.fn().mockResolvedValue(mockDonation),
            findById: jest.fn().mockResolvedValue(mockDonation),
            findAll: jest.fn().mockResolvedValue([mockDonation]),
            findByDonorId: jest.fn().mockResolvedValue([mockDonation]),
            findByOngId: jest.fn().mockResolvedValue([mockDonation]),
            update: jest.fn().mockImplementation((id, data) => Promise.resolve({
              ...mockDonation,
              ...data,
            } as unknown as DonationEntity)),
          },
        },
        {
          provide: DonationItemRepository,
          useValue: {
            createMany: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: S3Service,
          useValue: {
            uploadFile: jest.fn().mockResolvedValue('https://example.com/receipt.jpg'),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            create: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: OngRepository,
          useValue: {
            findById: jest.fn().mockResolvedValue(mockOng),
          },
        },
      ],
    }).compile();

    service = module.get<DonationService>(DonationService);
    donationRepository = module.get<DonationRepository>(DonationRepository);
    donationItemRepository = module.get<DonationItemRepository>(DonationItemRepository);
    s3Service = module.get<S3Service>(S3Service);
    notificationService = module.get<NotificationService>(NotificationService);
    ongRepository = module.get<OngRepository>(OngRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDonation', () => {
    it('should create a money donation', async () => {
      const createDonationDto = {
        donorId: 'donor1',
        ongId: 'ong1',
        type: DonationType.MONEY,
        amount: 100,
        transactionId: 'transaction1',
        notes: 'Test donation',
        receipt: mockReceipt,
      } as CreateDonationDto;

      const result = await service.createDonation(createDonationDto);

      expect(s3Service.uploadFile).toHaveBeenCalledWith(
        //createDonationDto.receipt.buffer,
        'donations',
        //createDonationDto.receipt.originalname,
      );
      expect(donationRepository.create).toHaveBeenCalledWith({
        donorId: 'donor1',
        ongId: 'ong1',
        type: DonationType.MONEY,
        status: DonationStatus.PENDING,
        amount: 100,
        transactionId: 'transaction1',
        notes: 'Test donation',
        receiptUrl: 'https://example.com/receipt.jpg',
      });
      expect(donationItemRepository.createMany).not.toHaveBeenCalled();
      expect(ongRepository.findById).toHaveBeenCalledWith('ong1');
      expect(notificationService.create).toHaveBeenCalledWith({
        userId: 'ongUser1',
        type: NotificationType.DONATION_RECEIVED,
        title: 'New donation received',
        message: 'You have received a new donation of money',
        referenceId: 'donation1',
        referenceType: 'donation',
      });
      expect(result).toEqual(mockDonation);
    });

    it('should create an items donation', async () => {
      const createDonationDto = {
        donorId: 'donor1',
        ongId: 'ong1',
        type: DonationType.ITEMS,
        items: [
          { name: 'Item 1', quantity: 2, description: 'Description 1' },
          { name: 'Item 2', quantity: 1, description: 'Description 2' },
        ],
        notes: 'Test donation',
        receipt: mockReceipt,
      } as CreateDonationDto;

      const result = await service.createDonation(createDonationDto);

      expect(donationRepository.create).toHaveBeenCalled();
      expect(donationItemRepository.createMany).toHaveBeenCalledWith([
        { donationId: 'donation1', name: 'Item 1', quantity: 2, description: 'Description 1' },
        { donationId: 'donation1', name: 'Item 2', quantity: 1, description: 'Description 2' },
      ]);
      expect(notificationService.create).toHaveBeenCalledWith({
        userId: 'ongUser1',
        type: NotificationType.DONATION_RECEIVED,
        title: 'New donation received',
        message: 'You have received a new donation of items',
        referenceId: 'donation1',
        referenceType: 'donation',
      });
      expect(result).toEqual(mockDonation);
    });

    it('should throw an error for money donation without amount', async () => {
      const createDonationDto = {
        donorId: 'donor1',
        ongId: 'ong1',
        type: DonationType.MONEY,
        transactionId: 'transaction1',
        receipt: mockReceipt,
      } as CreateDonationDto;

      await expect(service.createDonation(createDonationDto)).rejects.toThrow(
        BusinessRuleValidationException,
      );
      expect(donationRepository.create).not.toHaveBeenCalled();
    });

    it('should throw an error for items donation without items', async () => {
      const createDonationDto = {
        donorId: 'donor1',
        ongId: 'ong1',
        type: DonationType.ITEMS,
        receipt: mockReceipt,
      } as CreateDonationDto;

      await expect(service.createDonation(createDonationDto)).rejects.toThrow(
        BusinessRuleValidationException,
      );
      expect(donationRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getDonations', () => {
    it('should return donations based on filters', async () => {
      const filters = { ongId: 'ong1', status: DonationStatus.PENDING };

      const result = await service.getDonations(filters);

      expect(donationRepository.findAll).toHaveBeenCalledWith(filters);
      expect(result).toEqual([mockDonation]);
    });
  });

  describe('getDonationById', () => {
    it('should return a donation by id', async () => {
      const result = await service.getDonationById('donation1');

      expect(donationRepository.findById).toHaveBeenCalledWith('donation1');
      expect(result).toEqual(mockDonation);
    });
  });

  describe('confirmDonation', () => {
    it('should confirm a pending donation', async () => {
      const result = await service.confirmDonation('donation1', 'confirmer1', 'Confirmation note');

      expect(donationRepository.findById).toHaveBeenCalledWith('donation1');
      expect(donationRepository.update).toHaveBeenCalledWith('donation1', {
        status: DonationStatus.CONFIRMED,
        confirmationDate: expect.any(Date),
        confirmedBy: 'confirmer1',
        notes: 'Confirmation note',
      });
      expect(notificationService.create).toHaveBeenCalledWith({
        userId: 'donor1',
        type: NotificationType.DONATION_CONFIRMED,
        title: 'Donation confirmed',
        message: 'Your donation has been confirmed. Thank you for your support!',
        referenceId: 'donation1',
        referenceType: 'donation',
      });
    });

    it('should throw an error if donation is not pending', async () => {
      jest.spyOn(donationRepository, 'findById').mockResolvedValue(mockConfirmedDonation);

      await expect(service.confirmDonation('donation1', 'confirmer1')).rejects.toThrow(
        BusinessRuleValidationException,
      );
      expect(donationRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('cancelDonation', () => {
    it('should cancel a pending donation', async () => {
      const result = await service.cancelDonation('donation1');

      expect(donationRepository.findById).toHaveBeenCalledWith('donation1');
      expect(donationRepository.update).toHaveBeenCalledWith('donation1', {
        status: DonationStatus.CANCELLED,
      });
    });

    it('should throw an error if donation is not pending', async () => {
      jest.spyOn(donationRepository, 'findById').mockResolvedValue(mockConfirmedDonation);

      await expect(service.cancelDonation('donation1')).rejects.toThrow(
        BusinessRuleValidationException,
      );
      expect(donationRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('getDonationsByDonor', () => {
    it('should return donations by donor id', async () => {
      const result = await service.getDonationsByDonor('donor1');

      expect(donationRepository.findByDonorId).toHaveBeenCalledWith('donor1');
      expect(result).toEqual([mockDonation]);
    });
  });

  describe('getDonationsByOng', () => {
    it('should return donations by ONG id', async () => {
      const result = await service.getDonationsByOng('ong1');

      expect(donationRepository.findByOngId).toHaveBeenCalledWith('ong1');
      expect(result).toEqual([mockDonation]);
    });
  });
});