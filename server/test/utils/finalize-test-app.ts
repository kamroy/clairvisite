import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from '../../src/common/filters/http-exception.filter';

// Reproduit le bootstrap de src/main.ts (préfixe /api, cookies, ValidationPipe,
// filtre d'exception global) pour que les tests d'intégration passent par le même
// pipeline HTTP qu'en production. `configure` permet d'ajouter des étapes (ex. un
// guard global) avant `app.init()`, qui doit rester le tout dernier appel.
export async function finalizeTestApp(
  moduleRef: TestingModule,
  configure?: (app: INestApplication) => void,
): Promise<INestApplication> {
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  configure?.(app);
  await app.init();
  return app;
}
