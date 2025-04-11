import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
  } from '@nestjs/common';
  import { Request, Response } from 'express';
  import { DomainException } from '../../core/exceptions/domain.exception';
  
  @Catch()
  export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);
  
    catch(exception: any, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const request = ctx.getRequest<Request>();
      
      let status = HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Error interno del servidor';
      let error = 'Internal Server Error';
      
      // Manejo de excepciones HTTP
      if (exception instanceof HttpException) {
        status = exception.getStatus();
        const errorResponse = exception.getResponse();
        message = 
          typeof errorResponse === 'object' && 'message' in errorResponse
            ? Array.isArray(errorResponse['message'])
              ? errorResponse['message'][0]
              : errorResponse['message']
            : exception.message;
        error = exception.name;
      }
      
      // Manejo de excepciones de dominio
      else if (exception instanceof DomainException) {
        status = HttpStatus.BAD_REQUEST;
        message = exception.message;
        error = exception.name;
      }
      
      // Log del error para depuración
      this.logger.error(`${request.method} ${request.url}`, exception.stack);
      
      // Respuesta formateada de error
      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message,
        error,
      });
    }
  }