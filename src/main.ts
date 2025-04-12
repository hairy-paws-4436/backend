import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 4000;
  const apiPrefix = configService.get<string>('API_PREFIX') || 'api';
  const appName = configService.get<string>('APP_NAME') || 'HairyPaws';
  const appVersion = configService.get<string>('APP_VERSION') || '1.0';

  // Prefijo global para todas las rutas
  app.setGlobalPrefix(apiPrefix);

  // Middleware de seguridad
  app.use(helmet());
  
  // CORS
  app.enableCors();

  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Filtro global de excepciones
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger
  const config = new DocumentBuilder()
    .setTitle(`${appName} API`)
    .setDescription(`API de adopción de mascotas ${appName}`)
    .setVersion(appVersion)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  await app.listen(port);
  console.log(`Aplicación corriendo en: http://localhost:${port}/${apiPrefix}`);
  console.log(`Documentación: http://localhost:${port}/${apiPrefix}/docs`);
}
bootstrap();