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
      const result = await this.dataSource.query(`
        EXEC [dbo].[sp_GetEligibleRegistrantsByArea] @AreaCodes = ?
      `, [areaCodesParam]);
      return result;
    } catch (error) {
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
      
      // Execute the stored procedure
      const result = await this.dataSource.query(`
        DECLARE @DrawGuid UNIQUEIDENTIFIER
        EXEC [dbo].[sp_SelectRandomWinners] 
          @PrizeName = ?,
          @NumberOfWinners = ?,
          @AreaCodes = ?,
          @CreatedBy = ?,
          @DrawGuid = @DrawGuid OUTPUT
        SELECT @DrawGuid as DrawGuid
      `, [dto.prizeName, dto.numberOfWinners, areaCodesParam, dto.createdBy || 'system']);

      if (!result || result.length === 0) {
        throw new BadRequestException('No winners were selected. Check if there are enough eligible registrants.');
      }

      // The stored procedure returns the winners directly
      // But we need to handle the DrawGuid separately if needed
      const winners = result.filter(row => row.id); // Filter out the DrawGuid result
      
      if (winners.length === 0) {
        throw new BadRequestException('Draw execution failed - no winners returned');
      }

      return winners;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to execute draw: ' + error.message);
    }
  }

  async getWinnersByDraw(drawGuid: string): Promise<DrawResult[]> {
    try {
      const result = await this.dataSource.query(`
        EXEC [dbo].[sp_GetWinnersByDraw] @DrawGuid = ?
      `, [drawGuid]);

      if (!result || result.length === 0) {
        throw new NotFoundException(`No winners found for draw ${drawGuid}`);
      }

      return result;
    } catch (error) {
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

      const result = await this.dataSource.query(`
        EXEC [dbo].[sp_ConfirmWinner] @RegistrantId = ?, @Status = ?
      `, [dto.registrantId, dto.status]);

      if (!result || result.length === 0 || result[0].RowsAffected === 0) {
        throw new NotFoundException(`Registrant ${dto.registrantId} not found or not in pending validation status`);
      }

      return result[0];
    } catch (error) {
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

      const result = await this.dataSource.query(`
        EXEC [dbo].[sp_BulkConfirmDraw] @DrawGuid = ?, @Status = ?
      `, [dto.drawGuid, dto.status]);

      if (!result || result.length === 0) {
        throw new NotFoundException(`Draw ${dto.drawGuid} not found`);
      }

      return result[0];
    } catch (error) {
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
