import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginDto } from '../dto/login.dto';

/**
 * O LocalAuthGuard roda ANTES dos Pipes, então o ValidationPipe não
 * protege o login. Este guard valida o corpo com o LoginDto antes dele.
 */
@Injectable()
export class LoginBodyGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const dto = plainToInstance(LoginDto, req.body);
    const errors = await validate(dto);

    if (errors.length > 0) {
      throw new BadRequestException('Dados de login inválidos.');
    }
    return true;
  }
}