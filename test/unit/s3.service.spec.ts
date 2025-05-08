import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { S3Service } from '../../src/infrastructure/services/aws/s3.service';
import { Logger } from '@nestjs/common';

jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({}),
    })),
    PutObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn(),
  };
});

describe('S3Service', () => {
  let service: S3Service;
  let configService: ConfigService;
  let s3Client: any;

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key) => {
              const values = {
                'AWS_REGION': 'us-east-1',
                'AWS_ACCESS_KEY_ID': 'test-access-key',
                'AWS_SECRET_ACCESS_KEY': 'test-secret-key',
                'AWS_S3_BUCKET_NAME': 'test-bucket',
              };
              return values[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
    configService = module.get<ConfigService>(ConfigService);
    s3Client = (service as any).s3Client;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload a file to S3', async () => {
      const file = Buffer.from('test file content');
      const folder = 'test-folder';
      const originalName = 'test-file.jpg';

      const result = await service.uploadFile(file, folder, originalName);

      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: expect.stringMatching(/^test-folder\/.+\.jpg$/),
        Body: file,
        ContentDisposition: 'inline',
        ContentType: 'image/jpeg',
      });
      expect(s3Client.send).toHaveBeenCalled();
      expect(result).toMatch(/^https:\/\/test-bucket\.s3\.us-east-1\.amazonaws\.com\/test-folder\/.+\.jpg$/);
    });

    it('should throw an error if file extension cannot be determined', async () => {
      const file = Buffer.from('test file content');
      const folder = 'test-folder';
      const originalName = '.';

      await expect(service.uploadFile(file, folder, originalName)).rejects.toThrow(
        'Could not determine file extension.',
      );
    });

    it('should throw an error if S3 upload fails', async () => {
      jest.spyOn(s3Client, 'send').mockRejectedValue(new Error('S3 upload error'));

      const file = Buffer.from('test file content');
      const folder = 'test-folder';
      const originalName = 'test-file.jpg';

      await expect(service.uploadFile(file, folder, originalName)).rejects.toThrow(
        'S3 upload error',
      );
    });
  });

  describe('deleteFile', () => {
    it('should delete a file from S3', async () => {
      const fileUrl = 'https://test-bucket.s3.us-east-1.amazonaws.com/test-folder/test-file.jpg';

      await service.deleteFile(fileUrl);

      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'test-folder/test-file.jpg',
      });
      expect(s3Client.send).toHaveBeenCalled();
    });

    it('should throw an error if S3 delete fails', async () => {
      jest.spyOn(s3Client, 'send').mockRejectedValue(new Error('S3 delete error'));

      const fileUrl = 'https://test-bucket.s3.us-east-1.amazonaws.com/test-folder/test-file.jpg';

      await expect(service.deleteFile(fileUrl)).rejects.toThrow(
        'S3 delete error',
      );
    });
  });

  describe('uploadMultipleFiles', () => {
    it('should upload multiple files to S3', async () => {
      const files = [
        Buffer.from('file1 content'),
        Buffer.from('file2 content'),
      ];
      const folder = 'test-folder';
      const originalNames = ['file1.jpg', 'file2.png'];

      jest.spyOn(service, 'uploadFile').mockImplementation((file, folder, name) => {
        return Promise.resolve(`https://test-bucket.s3.us-east-1.amazonaws.com/${folder}/${name}`);
      });

      const result = await service.uploadMultipleFiles(files, folder, originalNames);

      expect(service.uploadFile).toHaveBeenCalledTimes(2);
      expect(service.uploadFile).toHaveBeenNthCalledWith(1, files[0], folder, originalNames[0]);
      expect(service.uploadFile).toHaveBeenNthCalledWith(2, files[1], folder, originalNames[1]);
      expect(result).toEqual([
        'https://test-bucket.s3.us-east-1.amazonaws.com/test-folder/file1.jpg',
        'https://test-bucket.s3.us-east-1.amazonaws.com/test-folder/file2.png',
      ]);
    });

    it('should throw an error if any file upload fails', async () => {
      jest.spyOn(service, 'uploadFile').mockRejectedValue(new Error('Upload error'));

      const files = [Buffer.from('file content')];
      const folder = 'test-folder';
      const originalNames = ['file.jpg'];

      await expect(service.uploadMultipleFiles(files, folder, originalNames)).rejects.toThrow(
        'Upload error',
      );
    });
  });

  describe('getContentType', () => {
    it('should return the correct content type for known extensions', () => {
      const testCases = [
        { extension: 'jpg', expected: 'image/jpeg' },
        { extension: 'jpeg', expected: 'image/jpeg' },
        { extension: 'png', expected: 'image/png' },
        { extension: 'gif', expected: 'image/gif' },
        { extension: 'pdf', expected: 'application/pdf' },
        { extension: 'doc', expected: 'application/msword' },
        { extension: 'docx', expected: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
        { extension: 'xls', expected: 'application/vnd.ms-excel' },
        { extension: 'xlsx', expected: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
        { extension: 'txt', expected: 'text/plain' },
      ];

      testCases.forEach(({ extension, expected }) => {
        expect((service as any).getContentType(extension)).toEqual(expected);
      });
    });

    it('should return a default content type for unknown extensions', () => {
      expect((service as any).getContentType('unknown')).toEqual('application/octet-stream');
    });

    it('should handle case insensitivity', () => {
      expect((service as any).getContentType('PNG')).toEqual('image/png');
      expect((service as any).getContentType('Jpg')).toEqual('image/jpeg');
    });
  });
});