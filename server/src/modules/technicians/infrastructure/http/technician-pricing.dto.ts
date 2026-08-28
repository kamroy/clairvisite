import { IsNumber, IsString, Max, MaxLength, Min } from 'class-validator';

export class AddPricingItemDto {
  @IsString()
  @MaxLength(120)
  label: string;

  @IsNumber()
  @Min(0)
  @Max(100000)
  price: number;
}
