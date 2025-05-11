import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtStrategy } from '../../src/infrastructure/services/auth/jwt.strategy';
import { JwtStrategyMock } from './jwt-mock';
import * as path from 'node:path';
import { UserModule } from '../../src/presentation/modules/user.module';
import { AnimalModule } from '../../src/presentation/modules/animal.module';
import { AdoptionModule } from '../../src/presentation/modules/adoption.module';
import { EventModule } from '../../src/presentation/modules/event.module';
import { NotificationModule } from '../../src/presentation/modules/notification.module';
import { OngModule } from '../../src/presentation/modules/ong.module';
import { DonationModule } from '../../src/presentation/modules/donation.module';
import { AuthModule } from '../../src/presentation/modules/auth.module';
import { AdminModule } from '../../src/presentation/modules/admin.module';
import { DataSource } from 'typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';

class MockJwtAuthGuard {
  canActivate(context) {
    const request = context.switchToHttp().getRequest();
    request.user = {
      id: 'mock-user-id',
      email: 'mock@example.com',
      role: 'ADOPTER'
    };
    return true;
  }
}
export class TestSetup {
  public app: INestApplication;
  private moduleFixture: TestingModule;

  async initialize(): Promise<void> {
    const dbConfig = {
      type: 'mysql' as const,
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'TokisakiKurumi12345%',
      database: 'hairy_paws_test',
      entities: [path.join(__dirname, '../../src/**/*.entity{.ts,.js}')],
      synchronize: true,
      dropSchema: true,
    };

    this.moduleFixture = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot(dbConfig),
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: 'test-secret-key',
          signOptions: { expiresIn: '1h' },
        }),
        UserModule,
        AnimalModule,
        AdoptionModule,
        EventModule,
        NotificationModule,
        OngModule,
        DonationModule,
        AuthModule,
        AdminModule
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: MockJwtAuthGuard,
        },
      ],
    }).overrideProvider(JwtStrategy)
      .useValue(JwtStrategyMock).compile();

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
    try {
      const dataSource = this.app.get(DataSource);
      if (dataSource && dataSource.isInitialized) {
        await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
        const entities = dataSource.entityMetadatas;
        for (const entity of entities) {
          await dataSource.query(`TRUNCATE TABLE ${entity.tableName}`);
        }
        await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
      }
    }catch (error) {
    }
  }


  async cleanup(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
  }
}