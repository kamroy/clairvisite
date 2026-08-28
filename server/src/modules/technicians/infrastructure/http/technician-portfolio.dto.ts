import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestPortfolioUploadUrlDto {
  @IsString()
  @MaxLength(255)
  fileName: string;

  @IsString()
  @MaxLength(100)
  contentType: string;
}

export class AttachPortfolioItemDto {
  @IsString()
  @MaxLength(500)
  key: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  caption?: string;
}
