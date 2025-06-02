// src/raffle/raffle.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RaffleController } from './raffle.controller';
import { RaffleService } from './raffle.service';
import { Draw } from './entities/draw.entity';
import { RaffleAreaCode } from './entities/raffle-area-code.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Draw, RaffleAreaCode])
  ],
  controllers: [RaffleController],
  providers: [RaffleService],
  exports: [RaffleService],
})
export class RaffleModule {}

