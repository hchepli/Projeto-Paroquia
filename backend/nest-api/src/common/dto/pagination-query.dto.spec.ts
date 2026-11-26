import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PaginationQueryDto } from './pagination-query.dto';

const check = (plain: Record<string, unknown>) =>
  validate(plainToInstance(PaginationQueryDto, plain));

describe('PaginationQueryDto', () => {
  it('aceita os valores padrão', async () => {
    expect(await check({})).toHaveLength(0);
  });

  it('aceita o limite máximo de limit e page', async () => {
    expect(await check({ limit: '100', page: '10000' })).toHaveLength(0);
  });

  it.each([
    ['limit acima do teto', { limit: '101' }],
    ['limit zero', { limit: '0' }],
    ['page acima do teto', { page: '10001' }],
    ['page zero', { page: '0' }],
    ['search muito longo', { search: 'a'.repeat(101) }],
    ['sortBy muito longo', { sortBy: 'a'.repeat(51) }],
    ['order inválida', { order: 'sideways' }],
  ])('recusa %s', async (_nome, plain) => {
    expect((await check(plain)).length).toBeGreaterThan(0);
  });
});