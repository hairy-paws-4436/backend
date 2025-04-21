import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  S3Client, 
  PutObjectCommand, 
  DeleteObjectCommand 
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly logger = new Logger(S3Service.name);

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      }
    });
    this.bucket = this.configService.get<string>('AWS_S3_BUCKET_NAME') || '';
  }

  async uploadFile(
    file: Buffer,
    folder: string = 'general',
    originalName: string,
  ): Promise<string> {
    try {
      const fileExtension = originalName.split('.').pop();
      if (!fileExtension) {
        throw new Error('Could not determine file extension.');
      }
      const fileName = `${folder}/${uuidv4()}.${fileExtension}`;
  
      const params = {
        Bucket: this.bucket,
        Key: fileName,
        Body: file,
        ContentDisposition: 'inline',
        ContentType: this.getContentType(fileExtension),
      };
  
      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);
      
      const fileUrl = `https://${this.bucket}.s3.${this.configService.get<string>('AWS_REGION')}.amazonaws.com/${fileName}`;
      this.logger.log(`File uploaded successfully: ${fileUrl}`);
  
      return fileUrl;
    } catch (error) {
      this.logger.error(`Error uploading file to S3: ${error.message}`);
      throw error;
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const key = this.getKeyFromUrl(fileUrl);

      const params = {
        Bucket: this.bucket,
        Key: key,
      };

      const command = new DeleteObjectCommand(params);
      await this.s3Client.send(command);
      
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting file from S3: ${error.message}`);
      throw error;
    }
  }

  async uploadMultipleFiles(
    files: Buffer[],
    folder: string = 'general',
    originalNames: string[],
  ): Promise<string[]> {
    try {
      const uploadPromises = files.map((file, index) =>
        this.uploadFile(file, folder, originalNames[index]),
      );

      return await Promise.all(uploadPromises);
    } catch (error) {
      this.logger.error(`Error uploading multiple files to S3: ${error.message}`);
      throw error;
    }
  }

  private getKeyFromUrl(fileUrl: string): string {
    const urlParts = fileUrl.split('/');
    return urlParts.slice(3).join('/');
  }

  private getContentType(extension: string): string {
    const contentTypes = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      txt: 'text/plain',
    };

    return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
  }
}