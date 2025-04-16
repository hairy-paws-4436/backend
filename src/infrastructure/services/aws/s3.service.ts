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

  /**
   * Sube un archivo a S3
   * @param file Buffer del archivo
   * @param folder Carpeta donde se guardará (opcional)
   * @param originalName Nombre original del archivo
   * @returns URL del archivo subido
   */
  async uploadFile(
    file: Buffer,
    folder: string = 'general',
    originalName: string,
  ): Promise<string> {
    try {
      const fileExtension = originalName.split('.').pop();
      if (!fileExtension) {
        throw new Error('No se pudo determinar la extensión del archivo.');
      }
      const fileName = `${folder}/${uuidv4()}.${fileExtension}`;
  
      // Configuración para la subida - QUITAR ACL
      const params = {
        Bucket: this.bucket,
        Key: fileName,
        Body: file,
        // Eliminar la línea ACL: 'public-read'
        ContentDisposition: 'inline',
        ContentType: this.getContentType(fileExtension),
      };
  
      // Subir a S3 usando comando de v3
      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);
      
      // Construir la URL manualmente
      const fileUrl = `https://${this.bucket}.s3.${this.configService.get<string>('AWS_REGION')}.amazonaws.com/${fileName}`;
      this.logger.log(`Archivo subido correctamente: ${fileUrl}`);
  
      return fileUrl;
    } catch (error) {
      this.logger.error(`Error al subir archivo a S3: ${error.message}`);
      throw error;
    }
  }

  /**
   * Elimina un archivo de S3
   * @param fileUrl URL completa del archivo a eliminar
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extraer la clave del archivo de la URL
      const key = this.getKeyFromUrl(fileUrl);

      const params = {
        Bucket: this.bucket,
        Key: key,
      };

      // Eliminar usando comando de v3
      const command = new DeleteObjectCommand(params);
      await this.s3Client.send(command);
      
      this.logger.log(`Archivo eliminado correctamente: ${key}`);
    } catch (error) {
      this.logger.error(`Error al eliminar archivo de S3: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sube múltiples archivos a S3
   * @param files Array de buffers de archivos
   * @param folder Carpeta donde se guardarán
   * @param originalNames Array de nombres originales de los archivos
   * @returns Array de URLs de los archivos subidos
   */
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
      this.logger.error(
        `Error al subir múltiples archivos a S3: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Extrae la clave de un archivo de su URL
   * @param fileUrl URL del archivo
   * @returns Clave del archivo
   */
  private getKeyFromUrl(fileUrl: string): string {
    const urlParts = fileUrl.split('/');
    return urlParts.slice(3).join('/');
  }

  /**
   * Determina el tipo de contenido en base a la extensión
   * @param extension Extensión del archivo
   * @returns Tipo de contenido MIME
   */
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