import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import { Request, Response } from 'express';

const PRISMA_ERROR_MAP: Record<string, { status: number; message: string }> = {
  P2002: { status: HttpStatus.CONFLICT, message: 'A record with these details already exists' },
  P2025: { status: HttpStatus.NOT_FOUND, message: 'Record not found' },
  P2003: { status: HttpStatus.BAD_REQUEST, message: 'Related record not found' },
};

@Catch(PrismaClientKnownRequestError, PrismaClientValidationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('PrismaExceptionFilter');

  catch(exception: PrismaClientKnownRequestError | PrismaClientValidationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';

    if (exception instanceof PrismaClientKnownRequestError) {
      const mapped = PRISMA_ERROR_MAP[exception.code];
      if (mapped) {
        status = mapped.status;
        message = mapped.message;
      } else {
        this.logger.error(`Unmapped Prisma error ${exception.code}: ${exception.message}`);
      }
    } else {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid query';
      this.logger.error(`Prisma validation error: ${exception.message}`);
    }

    response.status(status).json({
      statusCode: status,
      error: HttpStatus[status].replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
