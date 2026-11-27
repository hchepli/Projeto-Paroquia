import { describe, expect, it } from 'vitest';
import { ApiError, extractMessage, getFriendlyErrorMessage } from '@/lib/errors';

const err = (status: number, message = '') => new ApiError(message, status, null);

describe('getFriendlyErrorMessage', () => {
  it('400 e 409 mostram a mensagem do back', () => {
    expect(getFriendlyErrorMessage(err(400, 'Nome é obrigatório'))).toBe('Nome é obrigatório');
    expect(getFriendlyErrorMessage(err(409, 'Voluntário já está nesta escala'))).toBe(
      'Voluntário já está nesta escala',
    );
  });

  it('400 sem mensagem usa o fallback', () => {
    expect(getFriendlyErrorMessage(err(400, ''), 'Não deu certo.')).toBe('Não deu certo.');
  });

  it('403 tem texto fixo de permissão', () => {
    expect(getFriendlyErrorMessage(err(403, 'Forbidden resource'))).toBe(
      'Você não tem permissão para realizar esta ação.',
    );
  });

  it('429 pede para aguardar', () => {
    expect(getFriendlyErrorMessage(err(429, 'ThrottlerException'))).toMatch(/Aguarde um minuto/);
  });

  it('503 usa a mensagem do proxy ou o texto padrão', () => {
    expect(getFriendlyErrorMessage(err(503, 'Fora do ar'))).toBe('Fora do ar');
    expect(getFriendlyErrorMessage(err(503, ''))).toMatch(/fora do ar/);
  });

  it('5xx nunca repassa texto do back', () => {
    const msg = getFriendlyErrorMessage(err(500, 'PrismaClientKnownRequestError'));
    expect(msg).toBe('Erro no servidor. Tente novamente em instantes.');
  });

  it('erro que não é ApiError usa message ou fallback', () => {
    expect(getFriendlyErrorMessage(new Error('boom'))).toBe('boom');
    expect(getFriendlyErrorMessage('x', 'Erro inesperado.')).toBe('Erro inesperado.');
  });
});

describe('extractMessage', () => {
  it('junta array de mensagens de validação', () => {
    expect(extractMessage({ message: ['a', 'b'] }, 'f')).toBe('a; b');
  });
  it('usa string e cai no fallback quando não há mensagem', () => {
    expect(extractMessage({ message: 'oi' }, 'f')).toBe('oi');
    expect(extractMessage(null, 'f')).toBe('f');
    expect(extractMessage({ message: '  ' }, 'f')).toBe('f');
  });
});