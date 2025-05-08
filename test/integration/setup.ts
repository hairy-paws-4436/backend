import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppModule } from '../../src/app.module';
import { getConnection } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

export class TestSetup {
  app: INestApplication;
  moduleFixture: TestingModule;

  async initialize(): Promise<void> {
    this.moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            type: 'mysql',
            host: configService.get('DB_HOST'),
            port: configService.get('DB_PORT'),
            username: configService.get('DB_USERNAME'),
            password: configService.get('DB_PASSWORD'),
            database: configService.get('DB_NAME_TEST'),
            entities: [__dirname + '/../../src/**/*.entity{.ts,.js}'],
            synchronize: true,
          }),
        }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            secret: configService.get('JWT_SECRET'),
            signOptions: { expiresIn: '1h' },
          }),
        }),
        AppModule,
      ],
    }).compile();

    this.app = this.moduleFixture.createNestApplication();
    this.app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await this.app.init();
  }

  async cleanup(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
  }

  async clearDatabase(): Promise<void> {
    const connection = getConnection();
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

    const tables = [
      'adoption',
      'donation_item',
      'donation',
      'animal',
      'ong',
      'notification',
      'user'
    ];

    for (const table of tables) {
      try {
        await connection.query(`TRUNCATE TABLE ${table};`);
      } catch (error) {
        console.warn(`Error al truncar tabla ${table}: ${error.message}`);
      }
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
  }

  getHttpServer() {
    return this.app.getHttpServer();
  }

  createTestFile(filename: string, content: string = 'test content'): string {
    const testFilePath = path.join(__dirname, '..', 'temp', filename);
    const dirPath = path.join(__dirname, '..', 'temp');

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(testFilePath, content);
    return testFilePath;
  }

  cleanupTestFiles(files: string[]): void {
    for (const file of files) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }
  }
}