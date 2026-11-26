import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  // Se faltar variável obrigatória, o Joi do AppModule derruba o boot aqui,
  // listando todas as que faltam.
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  const isProduction = config.get('NODE_ENV') === 'production';
  const swaggerFlag = config.get('ENABLE_SWAGGER');
  const swaggerEnabled =
    !isProduction || swaggerFlag === true || swaggerFlag === 'true';

  // Headers de segurança. A API só devolve JSON, então a CSP padrão serve.
  app.use(helmet());

  // RNF017: atrás do proxy o req.ip é o do proxy. Com hops > 0 o Express usa o
  // X-Forwarded-For. 0 = não confia em nenhum proxy (padrão seguro).
  // Só suba isso se o Nest NÃO for acessível diretamente pela internet.
  const trustProxyHops = Number(config.get('TRUST_PROXY_HOPS') ?? 0);
  if (trustProxyHops > 0) {
    app.set('trust proxy', trustProxyHops);
  }

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Sistema Paroquial - API')
      .setDescription(
        'API REST do sistema institucional e de gestão da paróquia (site público + painel admin).',
      )
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // SIGTERM/SIGINT (docker stop, deploy) -> fecha conexões (Prisma $disconnect) antes de sair.
  app.enableShutdownHooks();

  await app.listen(config.get<number>('PORT') ?? 3000);
}
bootstrap();