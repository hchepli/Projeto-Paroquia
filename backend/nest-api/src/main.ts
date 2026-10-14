import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Sistema Paroquial - API')
    .setDescription(
      'API REST do sistema institucional e de gestão da paróquia (site público + painel admin).',
    )
    .setVersion('0.1.0')
    .addBearerAuth() // pronto para quando o login/JWT (auth) estiver implementado
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove campos que não existem no DTO
      forbidNonWhitelisted: true, // 400 se vier campo que o DTO não conhece
      transform: true, // converte o JSON recebido pra instância da classe DTO
    }),
  );

  await app.listen(process.env.PORT ?? 3000);

}
bootstrap();