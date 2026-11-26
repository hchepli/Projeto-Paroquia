import { envValidationSchema, envValidationOptions } from './env.validation';

const base = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_SECRET: 'x'.repeat(32),
};
const cloudinary = {
  STORAGE_PROVIDER: 'cloudinary',
  CLOUDINARY_CLOUD_NAME: 'c',
  CLOUDINARY_API_KEY: 'k',
  CLOUDINARY_API_SECRET: 's',
};
const r2 = {
  STORAGE_PROVIDER: 'r2',
  R2_ACCOUNT_ID: 'a',
  R2_ACCESS_KEY_ID: 'k',
  R2_SECRET_ACCESS_KEY: 's',
  R2_BUCKET_NAME: 'b',
  R2_PUBLIC_URL: 'https://cdn.exemplo.com',
};

const validate = (env: Record<string, unknown>) =>
  envValidationSchema.validate(env, envValidationOptions);

describe('envValidationSchema', () => {
  it('aceita cloudinary completo e aplica padrões', () => {
    const { error, value } = validate({ ...base, ...cloudinary });
    expect(error).toBeUndefined();
    expect(value.NODE_ENV).toBe('development');
    expect(value.PORT).toBe(3000);
    expect(value.TRUST_PROXY_HOPS).toBe(0);
    expect(value.ENABLE_SWAGGER).toBe(false);
  });

  it('aceita r2 completo, com variáveis do cloudinary vazias', () => {
    const { error } = validate({
      ...base,
      ...r2,
      CLOUDINARY_CLOUD_NAME: '',
      CLOUDINARY_API_KEY: '',
      CLOUDINARY_API_SECRET: '',
    });
    expect(error).toBeUndefined();
  });

  it('exige as variáveis do provider escolhido e lista todas as que faltam', () => {
    const { error } = validate({ ...base, STORAGE_PROVIDER: 'r2' });
    const msg = error!.message;
    expect(msg).toContain('R2_ACCOUNT_ID');
    expect(msg).toContain('R2_BUCKET_NAME');
    expect(msg).toContain('R2_PUBLIC_URL');
  });

  it('recusa STORAGE_PROVIDER ausente ou inválido', () => {
    expect(validate({ ...base }).error).toBeDefined();
    expect(validate({ ...base, STORAGE_PROVIDER: 's3' }).error).toBeDefined();
  });

  it('recusa JWT_SECRET curto e DATABASE_URL ausente', () => {
    const { error } = validate({ JWT_SECRET: 'curto', ...cloudinary });
    expect(error!.message).toContain('JWT_SECRET');
    expect(error!.message).toContain('DATABASE_URL');
  });

  it.each(['abc', '-1', '1.5'])('recusa TRUST_PROXY_HOPS=%s', (v) => {
    expect(
      validate({ ...base, ...cloudinary, TRUST_PROXY_HOPS: v }).error,
    ).toBeDefined();
  });

  it('converte TRUST_PROXY_HOPS e ENABLE_SWAGGER de string', () => {
    const { value } = validate({
      ...base,
      ...cloudinary,
      TRUST_PROXY_HOPS: '2',
      ENABLE_SWAGGER: 'true',
    });
    expect(value.TRUST_PROXY_HOPS).toBe(2);
    expect(value.ENABLE_SWAGGER).toBe(true);
  });

  it('recusa NODE_ENV inválido', () => {
    expect(
      validate({ ...base, ...cloudinary, NODE_ENV: 'staging' }).error,
    ).toBeDefined();
  });
});