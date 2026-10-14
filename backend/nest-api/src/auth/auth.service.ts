import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { JWT_EXPIRES_IN_SECONDS } from './auth.constants';

// Hash fictício: quando o e-mail não existe, ainda rodamos o bcrypt
// para o tempo de resposta não revelar quais e-mails existem.
const DUMMY_HASH = bcrypt.hashSync('timing-attack-dummy', 10);

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    const passwordMatches = await bcrypt.compare(
      password,
      user?.passwordHash ?? DUMMY_HASH,
    );

    if (!user || !passwordMatches) {
      return null; // UC007 3a: erro genérico
    }

    // UC007 3b: só revelamos "inativa" depois de a senha estar correta
    if (user.status === 'INACTIVE') {
      throw new UnauthorizedException(
        'Conta inativa. Procure a secretaria da paróquia.',
      );
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  // Sem queries: cargo e pastoral são lidos do banco a cada
  // requisição pela JwtStrategy, então o token só carrega a identidade.
  login(user: { id: string; email: string }) {
    const payload = { sub: user.id, email: user.email };

    return {
      access_token: this.jwtService.sign(payload),
      expires_in: JWT_EXPIRES_IN_SECONDS,
    };
  }
}