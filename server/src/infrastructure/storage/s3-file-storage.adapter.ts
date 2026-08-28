import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateBucketCommand, DeleteObjectCommand, GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { FileStoragePort } from './file-storage.port';

const UPLOAD_URL_TTL_SECONDS = 15 * 60;
const DOWNLOAD_URL_TTL_SECONDS = 60 * 60;

@Injectable()
export class S3FileStorageAdapter implements FileStoragePort, OnModuleInit {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.getOrThrow('STORAGE_BUCKET');
    this.client = new S3Client({
      region: this.config.get('STORAGE_REGION', 'us-east-1'),
      endpoint: this.config.getOrThrow('STORAGE_ENDPOINT'),
      // Requis par MinIO (chemin /bucket/key) — un vrai S3 AWS accepte aussi ce mode.
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.config.getOrThrow('STORAGE_ACCESS_KEY_ID'),
        secretAccessKey: this.config.getOrThrow('STORAGE_SECRET_ACCESS_KEY'),
      },
    });
  }

  // Crée le bucket au démarrage s'il n'existe pas encore — confort de développement
  // local (MinIO démarre vide) ; en prod, le bucket est créé par l'infra (Terraform...).
  async onModuleInit() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
    }
  }

  getUploadUrl(key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType });
    return getSignedUrl(this.client, command, { expiresIn: UPLOAD_URL_TTL_SECONDS });
  }

  getDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: DOWNLOAD_URL_TTL_SECONDS });
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
