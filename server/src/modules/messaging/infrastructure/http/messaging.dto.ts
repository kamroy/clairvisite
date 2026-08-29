import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  attachment_key?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  attachment_file_name?: string;
}

export class RequestAttachmentUploadUrlDto {
  @IsString()
  @MaxLength(255)
  file_name: string;

  @IsString()
  @MaxLength(100)
  content_type: string;
}
