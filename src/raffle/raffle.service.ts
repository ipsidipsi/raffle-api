// src/raffle/raffle.service.ts - FIXED VERSION
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Draw } from './entities/draw.entity';
import { RaffleAreaCode } from './entities/raffle-area-code.entity';
import { RaffleDrawDto, ConfirmWinnerDto, BulkConfirmDto, EligibleCountDto } from './dto/raffle-draw.dto';
import { AreaInfo, EligibleCount, DrawResult, WinnerConfirmationResult } from './interfaces/raffle.interface';

@Injectable()
export class RaffleService {
  constructor(
    @InjectRepository(Draw)
    private drawRepository: Repository<Draw>,
    @InjectRepository(RaffleAreaCode)
    private areaRepository: Repository<RaffleAreaCode>,
    private dataSource: DataSource,
  ) {}

  async getAvailableAreas(): Promise<AreaInfo[]> {
    try {
      const result = await this.dataSource.query(`
        EXEC [dbo].[sp_GetAvailableAreas]
      `);
      return result;
    } catch (error) {
      throw new BadRequestException('Failed to fetch available areas: ' + error.message);
    }
  }

  async getEligibleCount(dto: EligibleCountDto): Promise<EligibleCount[]> {
    try {
      const areaCodesParam = dto.areaCodes?.join(',') || null;
      
      // Use direct string substitution for SQL Server stored procedure
      let query: string;
      if (areaCodesParam) {
        query = `EXEC [dbo].[sp_GetEligibleRegistrantsByArea] @AreaCodes = '${areaCodesParam}'`;
      } else {
        query = `EXEC [dbo].[sp_GetEligibleRegistrantsByArea] @AreaCodes = NULL`;
      }
      
      console.log('Executing query:', query);
      const result = await this.dataSource.query(query);
      console.log('Query result:', result);
      
      return result;
    } catch (error) {
      console.error('SQL Error in getEligibleCount:', error);
      throw new BadRequestException('Failed to get eligible count: ' + error.message);
    }
  }

  async executeDraw(dto: RaffleDrawDto): Promise<DrawResult[]> {
    try {
      // Validate input
      if (dto.numberOfWinners <= 0) {
        throw new BadRequestException('Number of winners must be greater than 0');
      }

      const areaCodesParam = dto.areaCodes?.join(',') || null;
      
      // Prepare the stored procedure call
      let query: string;
      if (areaCodesParam) {
        query = `
          DECLARE @DrawGuid UNIQUEIDENTIFIER
          EXEC [dbo].[sp_SelectRandomWinners] 
            @PrizeName = '${dto.prizeName.replace(/'/g, "''")}',
            @NumberOfWinners = ${dto.numberOfWinners},
            @AreaCodes = '${areaCodesParam}',
            @CreatedBy = '${(dto.createdBy || 'system').replace(/'/g, "''")}',
            @DrawGuid = @DrawGuid OUTPUT
        `;
      } else {
        query = `
          DECLARE @DrawGuid UNIQUEIDENTIFIER
          EXEC [dbo].[sp_SelectRandomWinners] 
            @PrizeName = '${dto.prizeName.replace(/'/g, "''")}',
            @NumberOfWinners = ${dto.numberOfWinners},
            @AreaCodes = NULL,
            @CreatedBy = '${(dto.createdBy || 'system').replace(/'/g, "''")}',
            @DrawGuid = @DrawGuid OUTPUT
        `;
      }
      
      console.log('Executing draw query:', query);
      const result = await this.dataSource.query(query);
      console.log('Draw result:', result);

      if (!result || result.length === 0) {
        throw new BadRequestException('No winners were selected. Check if there are enough eligible registrants.');
      }

      // Filter out any non-winner rows (drawGuid results, etc.)
      const winners = result.filter(row => row.id && row.accountNumber);
      
      if (winners.length === 0) {
        throw new BadRequestException('Draw execution failed - no winners returned');
      }

      return winners;
    } catch (error) {
      console.error('Error in executeDraw:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to execute draw: ' + error.message);
    }
  }

  async getWinnersByDraw(drawGuid: string): Promise<DrawResult[]> {
    try {
      const query = `EXEC [dbo].[sp_GetWinnersByDraw] @DrawGuid = '${drawGuid}'`;
      console.log('Executing getWinnersByDraw query:', query);
      
      const result = await this.dataSource.query(query);

      if (!result || result.length === 0) {
        throw new NotFoundException(`No winners found for draw ${drawGuid}`);
      }

      return result;
    } catch (error) {
      console.error('Error in getWinnersByDraw:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch winners: ' + error.message);
    }
  }

  async confirmWinner(dto: ConfirmWinnerDto): Promise<WinnerConfirmationResult> {
    try {
      if (!['valid_winner', 'invalid_winner'].includes(dto.status)) {
        throw new BadRequestException('Status must be either valid_winner or invalid_winner');
      }

      const query = `EXEC [dbo].[sp_ConfirmWinner] @RegistrantId = ${dto.registrantId}, @Status = '${dto.status}'`;
      console.log('Executing confirmWinner query:', query);
      
      const result = await this.dataSource.query(query);

      if (!result || result.length === 0 || result[0].RowsAffected === 0) {
        throw new NotFoundException(`Registrant ${dto.registrantId} not found or not in pending validation status`);
      }

      return result[0];
    } catch (error) {
      console.error('Error in confirmWinner:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to confirm winner: ' + error.message);
    }
  }

  async bulkConfirmDraw(dto: BulkConfirmDto): Promise<WinnerConfirmationResult> {
    try {
      if (!['valid_winner', 'invalid_winner'].includes(dto.status)) {
        throw new BadRequestException('Status must be either valid_winner or invalid_winner');
      }

      const query = `EXEC [dbo].[sp_BulkConfirmDraw] @DrawGuid = '${dto.drawGuid}', @Status = '${dto.status}'`;
      console.log('Executing bulkConfirmDraw query:', query);
      
      const result = await this.dataSource.query(query);

      if (!result || result.length === 0) {
        throw new NotFoundException(`Draw ${dto.drawGuid} not found`);
      }

      return result[0];
    } catch (error) {
      console.error('Error in bulkConfirmDraw:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to bulk confirm draw: ' + error.message);
    }
  }

  async getDrawHistory(limit: number = 10): Promise<Draw[]> {
    try {
      return await this.drawRepository.find({
        order: { drawTimestamp: 'DESC' },
        take: limit,
      });
    } catch (error) {
      throw new BadRequestException('Failed to fetch draw history: ' + error.message);
    }
  }

  async getDrawStats(): Promise<any> {
    try {
      const result = await this.dataSource.query(`
        SELECT 
          COUNT(DISTINCT d.id) as TotalDraws,
          COUNT(r.id) as TotalWinners,
          COUNT(CASE WHEN r.status = 'valid_winner' THEN 1 END) as ValidWinners,
          COUNT(CASE WHEN r.status = 'invalid_winner' THEN 1 END) as InvalidWinners,
          COUNT(CASE WHEN r.status = 'pending_validation' THEN 1 END) as PendingWinners
        FROM draws d
        LEFT JOIN registrants r ON d.id = r.drawId
      `);
      
      return result[0] || {
        TotalDraws: 0,
        TotalWinners: 0,
        ValidWinners: 0,
        InvalidWinners: 0,
        PendingWinners: 0
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch draw statistics: ' + error.message);
    }
  }
}