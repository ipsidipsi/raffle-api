// src/reports/reports.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Registrant } from '../registration/entities/registrants.entity';
import { RaffleAreaCode } from '../raffle/entities/raffle-area-code.entity';
import { Draw } from '../raffle/entities/draw.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Registrant, 
      RaffleAreaCode,
      Draw,
    ])
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}