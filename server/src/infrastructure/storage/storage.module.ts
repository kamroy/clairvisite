import { Global, Module } from '@nestjs/common';
import { FILE_STORAGE } from './file-storage.port';
import { S3FileStorageAdapter } from './s3-file-storage.adapter';

@Global()
@Module({
  providers: [{ provide: FILE_STORAGE, useClass: S3FileStorageAdapter }],
  exports: [FILE_STORAGE],
})
export class StorageModule {}
