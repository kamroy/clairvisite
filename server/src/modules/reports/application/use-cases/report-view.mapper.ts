import { FileStoragePort } from '../../../../infrastructure/storage/file-storage.port';
import { TechnicalReport } from '../../domain/report.entity';

// Petite fonction partagée par les deux use cases de lecture (technicien/acheteur) —
// pas un repository ni un port, juste l'enrichissement en URLs de téléchargement
// pré-signées avant de renvoyer le rapport au client.
export async function withPhotoDownloadUrls(report: TechnicalReport, storage: FileStoragePort) {
  const sections = await Promise.all(
    report.sections.map(async (section) => ({
      ...section,
      photos: await Promise.all(
        section.photos.map(async (photo) => ({ ...photo, downloadUrl: await storage.getDownloadUrl(photo.key) })),
      ),
    })),
  );
  return { ...report, sections };
}
