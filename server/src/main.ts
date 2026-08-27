import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.use(
    helmet({
      // API consommée par un front servi sur une autre origine (cf. README) : le
      // Cross-Origin-Resource-Policy par défaut de helmet ('same-origin') bloquerait
      // sinon les réponses côté navigateur en production.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser());
  // getOrThrow (pas get) : un CLIENT_URL manquant ferait retomber `cors` sur
  // `origin: '*'` combiné à `credentials: true` — une configuration incohérente,
  // à faire échouer bruyamment au démarrage plutôt que silencieusement en prod.
  app.enableCors({ origin: config.getOrThrow('CLIENT_URL'), credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = config.get('PORT') ?? 3000;
  await app.listen(port);
  console.log(`Serveur NestJS démarré sur http://localhost:${port}`);
}
bootstrap();
