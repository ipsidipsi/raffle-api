import { IsString, IsNumber, IsOptional, IsArray, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class RaffleDrawDto {
  @IsString()
  prizeName: string;

  @IsNumber()
  @Min(1)
  numberOfWinners: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  areaCodes?: string[];

  @IsOptional()
  @IsString()
  createdBy?: string;
}

export class ConfirmWinnerDto {
  @IsNumber()
  registrantId: number;

  @IsString()
  status: 'valid_winner' | 'invalid_winner';
}

export class BulkConfirmDto {
  @IsString()
  drawGuid: string;

  @IsString()
  status: 'valid_winner' | 'invalid_winner';
}

export class EligibleCountDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  areaCodes?: string[];
}