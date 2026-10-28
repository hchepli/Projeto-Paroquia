// src/common/decorators/strong-password.spec.ts
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ChangePasswordDto } from '../../users/dto/change-password.dto';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { LoginDto } from '../../auth/dto/login.dto';

const check = async (newPassword: unknown) =>
  validate(plainToInstance(ChangePasswordDto, { newPassword }));

describe('StrongPassword (UC001 / D5)', () => {
  it.each([
    'senha1234',
    'abcdefg1',
    '1abcdefg',
    'Çenha123é',
    'a'.repeat(71) + '1',
  ])('aceita %s', async (pw) => expect(await check(pw)).toHaveLength(0));

  it.each([
    ['curta demais', 'abc1'],
    ['só letras', 'somenteletras'],
    ['só números', '12345678'],
    ['longa demais (73)', 'a'.repeat(72) + '1'],
    ['não-string', 12345678],
  ])('rejeita senha %s', async (_label, pw) => {
    expect((await check(pw)).length).toBeGreaterThan(0);
  });
});

describe('DTOs: normalização de e-mail (D6)', () => {
  const base = { name: 'N', password: 'senha1234', roleId: 1 };

  it('CreateUserDto: trim + lowercase', async () => {
    const dto = plainToInstance(CreateUserDto, {
      ...base,
      email: '  Fulano@X.COM ',
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.email).toBe('fulano@x.com');
  });

  it('LoginDto normaliza igual ao cadastro (senão o usuário não loga)', () => {
    const dto = plainToInstance(LoginDto, {
      email: '  Fulano@X.COM ',
      password: 'x',
    });
    expect(dto.email).toBe('fulano@x.com');
  });

  it('CreateUserDto rejeita e-mail com mais de 180 caracteres', async () => {
    const longEmail = `${'a'.repeat(175)}@x.com`;
    const errors = await validate(
      plainToInstance(CreateUserDto, { ...base, email: longEmail }),
    );
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });
});
