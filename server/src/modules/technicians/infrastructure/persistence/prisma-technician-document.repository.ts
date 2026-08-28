import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/persistence/prisma/prisma.service';
import {
  TechnicianDocument,
  TechnicianDocumentRepositoryPort,
} from '../../domain/technician-document.repository.port';

@Injectable()
export class PrismaTechnicianDocumentRepository implements TechnicianDocumentRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(technicianId: string, key: string, fileName: string): Promise<TechnicianDocument> {
    return this.prisma.technicianDocument.create({ data: { technicianId, key, fileName } });
  }

  findAllByTechnicianId(technicianId: string): Promise<TechnicianDocument[]> {
    return this.prisma.technicianDocument.findMany({
      where: { technicianId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
