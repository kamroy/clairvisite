export const FILE_STORAGE = Symbol('FILE_STORAGE');

// Port générique de stockage objet (S3-compatible), consommé par les futurs modules
// report/signature/documents (Phases 2-3) — jamais par le domaine directement.
// URLs pré-signées : le navigateur upload/télécharge en direct sur le bucket, sans
// faire transiter les octets par le serveur Nest.
export interface FileStoragePort {
  getUploadUrl(key: string, contentType: string): Promise<string>;
  getDownloadUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}
