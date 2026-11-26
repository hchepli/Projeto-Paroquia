import * as Joi from 'joi';

// Obrigatória só quando o provider de storage escolhido for `provider`.
// Para o outro provider, aceita ausente ou vazia (o .env.example traz tudo em branco).
const requiredWhen = (provider: 'r2' | 'cloudinary') =>
  Joi.string().when('STORAGE_PROVIDER', {
    is: provider,
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  });

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3000),

  // Quantos proxies confiar no X-Forwarded-For. 0 = nenhum (padrão seguro).
  TRUST_PROXY_HOPS: Joi.number().integer().min(0).default(0),

  // Swagger (/docs): ligado fora de produção; em produção só com ENABLE_SWAGGER=true.
  ENABLE_SWAGGER: Joi.boolean().default(false),

  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),

  STORAGE_PROVIDER: Joi.string().valid('r2', 'cloudinary').required(),

  R2_ACCOUNT_ID: requiredWhen('r2'),
  R2_ACCESS_KEY_ID: requiredWhen('r2'),
  R2_SECRET_ACCESS_KEY: requiredWhen('r2'),
  R2_BUCKET_NAME: requiredWhen('r2'),
  R2_PUBLIC_URL: requiredWhen('r2'),

  CLOUDINARY_CLOUD_NAME: requiredWhen('cloudinary'),
  CLOUDINARY_API_KEY: requiredWhen('cloudinary'),
  CLOUDINARY_API_SECRET: requiredWhen('cloudinary'),
});

// abortEarly:false -> o boot lista TODAS as variáveis com problema de uma vez.
export const envValidationOptions = { abortEarly: false, allowUnknown: true };