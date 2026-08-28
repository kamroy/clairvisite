import { FileStoragePort } from '../../src/infrastructure/storage/file-storage.port';

// Fake déterministe : pas d'appel réseau, une URL prévisible dérivée de la clé —
// suffisant pour vérifier que les use cases appellent bien le port avec les bons
// arguments, sans dépendre d'un vrai bucket S3/MinIO en test.
export class FakeFileStorageAdapter implements FileStoragePort {
  async getUploadUrl(key: string): Promise<string> {
    return `https://fake-storage.test/upload/${encodeURIComponent(key)}`;
  }

  async getDownloadUrl(key: string): Promise<string> {
    return `https://fake-storage.test/download/${encodeURIComponent(key)}`;
  }

  async delete(): Promise<void> {}
}
