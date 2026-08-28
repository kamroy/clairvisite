import { Module } from '@nestjs/common';
import { TechniciansModule } from './technicians.module';
import { TechnicianDocumentsController } from './infrastructure/http/technician-documents.controller';
import { TechnicianPricingController } from './infrastructure/http/technician-pricing.controller';
import { TechnicianPortfolioController } from './infrastructure/http/technician-portfolio.controller';
import { RequestTechnicianDocumentUploadUrlUseCase } from './application/use-cases/request-technician-document-upload-url.use-case';
import { AttachTechnicianDocumentUseCase } from './application/use-cases/attach-technician-document.use-case';
import { ListMyTechnicianDocumentsUseCase } from './application/use-cases/list-my-technician-documents.use-case';
import { AddTechnicianPricingItemUseCase } from './application/use-cases/add-technician-pricing-item.use-case';
import { RemoveTechnicianPricingItemUseCase } from './application/use-cases/remove-technician-pricing-item.use-case';
import { ListTechnicianPricingItemsUseCase } from './application/use-cases/list-technician-pricing-items.use-case';
import { RequestTechnicianPortfolioUploadUrlUseCase } from './application/use-cases/request-technician-portfolio-upload-url.use-case';
import { AttachTechnicianPortfolioItemUseCase } from './application/use-cases/attach-technician-portfolio-item.use-case';
import { RemoveTechnicianPortfolioItemUseCase } from './application/use-cases/remove-technician-portfolio-item.use-case';
import { ListTechnicianPortfolioItemsUseCase } from './application/use-cases/list-technician-portfolio-items.use-case';
import { TECHNICIAN_DOCUMENT_REPOSITORY } from './domain/technician-document.repository.port';
import { TECHNICIAN_PRICING_REPOSITORY } from './domain/technician-pricing.repository.port';
import { TECHNICIAN_PORTFOLIO_REPOSITORY } from './domain/technician-portfolio.repository.port';
import { PrismaTechnicianDocumentRepository } from './infrastructure/persistence/prisma-technician-document.repository';
import { PrismaTechnicianPricingRepository } from './infrastructure/persistence/prisma-technician-pricing.repository';
import { PrismaTechnicianPortfolioRepository } from './infrastructure/persistence/prisma-technician-portfolio.repository';

// Module séparé de TechniciansModule (plutôt que fusionné dedans) : ces use cases
// dépendent soit de FILE_STORAGE (StorageModule) soit de repositories Prisma propres
// (Pricing) — des dépendances que TechniciansModule ne doit pas porter, car
// AdminModule et AvailabilitiesModule l'importent dans leurs tests e2e en overridant
// uniquement TECHNICIAN_REPOSITORY, jamais ces tokens-ci ni PrismaService.
// Regroupe tout ce qu'un technicien gère lui-même sur son profil public au-delà des
// champs de base : pièces justificatives (admin uniquement), grille tarifaire et
// portfolio (visibles publiquement).
@Module({
  imports: [TechniciansModule],
  controllers: [TechnicianDocumentsController, TechnicianPricingController, TechnicianPortfolioController],
  providers: [
    RequestTechnicianDocumentUploadUrlUseCase,
    AttachTechnicianDocumentUseCase,
    ListMyTechnicianDocumentsUseCase,
    AddTechnicianPricingItemUseCase,
    RemoveTechnicianPricingItemUseCase,
    ListTechnicianPricingItemsUseCase,
    RequestTechnicianPortfolioUploadUrlUseCase,
    AttachTechnicianPortfolioItemUseCase,
    RemoveTechnicianPortfolioItemUseCase,
    ListTechnicianPortfolioItemsUseCase,
    { provide: TECHNICIAN_DOCUMENT_REPOSITORY, useClass: PrismaTechnicianDocumentRepository },
    { provide: TECHNICIAN_PRICING_REPOSITORY, useClass: PrismaTechnicianPricingRepository },
    { provide: TECHNICIAN_PORTFOLIO_REPOSITORY, useClass: PrismaTechnicianPortfolioRepository },
  ],
})
export class TechnicianExtrasModule {}
