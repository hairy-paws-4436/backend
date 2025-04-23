import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';

/**
 * Configuración para la base de datos de testing
 */
export const testDatabaseConfig = {
  type: 'sqlite',
  database: ':memory:',
  synchronize: true,
  dropSchema: true,
  entities: [path.join(__dirname, ' ../../src/infrastructure/database/mysql/entities/**/*.entity{.ts,.js}')],
  logging: false,
};

/**
 * Crea un módulo de test con configuración estándar
 * @param metadata Módulos y proveedores para la prueba
 * @returns TestingModule compilado
 */
export async function createTestingModule(metadata: any): Promise<TestingModule> {
  const testingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
      }),
      TypeOrmModule.forRoot(testDatabaseConfig),
      ...(metadata.imports || []),
    ],
    controllers: [...(metadata.controllers || [])],
    providers: [
      ...(metadata.providers || []),
    ],
  }).compile();

  const app = testingModule.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();

  return testingModule;
}

/**
 * Clase base para los repositorios en memoria
 */
export class InMemoryRepository {
  protected items: any[] = [];

  async findAll(filters?: any): Promise<any[]> {
    return this.items;
  }

  async findById(id: string): Promise<any> {
    const item = this.items.find(i => i.id === id);
    if (!item) {
      throw new Error(`Item with id ${id} not found`);
    }
    return item;
  }

  async findOne(filters: any): Promise<any> {
    // Implementación básica para findOne
    const key = Object.keys(filters)[0];
    const value = filters[key];
    const item = this.items.find(i => i[key] === value);
    if (!item) {
      throw new Error(`Item not found`);
    }
    return item;
  }

  async create(entity: any): Promise<any> {
    this.items.push(entity);
    return entity;
  }

  async update(id: string, entity: any): Promise<any> {
    const index = this.items.findIndex(i => i.id === id);
    if (index === -1) {
      throw new Error(`Item with id ${id} not found`);
    }
    this.items[index] = { ...this.items[index], ...entity };
    return this.items[index];
  }

  async delete(id: string): Promise<void> {
    const index = this.items.findIndex(i => i.id === id);
    if (index === -1) {
      throw new Error(`Item with id ${id} not found`);
    }
    this.items.splice(index, 1);
  }

  async exists(filters: any): Promise<boolean> {
    // Implementación básica para exists
    const key = Object.keys(filters)[0];
    const value = filters[key];
    return this.items.some(i => i[key] === value);
  }
}