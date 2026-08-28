import { IsString, MaxLength } from 'class-validator';

export class RequestDocumentUploadUrlDto {
  @IsString()
  @MaxLength(255)
  fileName: string;

  @IsString()
  @MaxLength(100)
  contentType: string;
}

export class AttachDocumentDto {
  @IsString()
  @MaxLength(500)
  key: string;

  @IsString()
  @MaxLength(255)
  fileName: string;
}
