// test/integration/setup.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getConnection } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { testDatabaseConfig } from '../test-database-config';

export class TestSetup {
  public app: INestApplication;
  private moduleFixture: TestingModule;

  async initialize(): Promise<void> {
    this.moduleFixture = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          ...testDatabaseConfig,
          autoLoadEntities: true,
        }),
        AppModule,
      ],
    }).compile();

    this.app = this.moduleFixture.createNestApplication();
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await this.app.init();
  }

  getHttpServer() {
    return this.app.getHttpServer();
  }

  async clearDatabase(): Promise<void> {
    const connection = getConnection();
    const entities = connection.entityMetadatas;

    // Deshabilitar verificación de clave foránea
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // Truncar todas las tablas
    for (const entity of entities) {
      const repository = connection.getRepository(entity.name);
      await repository.query(`TRUNCATE TABLE ${entity.tableName}`);
    }

    // Volver a habilitar verificación de clave foránea
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  }

  async cleanup(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
  }
}