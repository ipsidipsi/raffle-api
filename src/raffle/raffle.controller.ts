// src/raffle/raffle.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { RaffleService } from './raffle.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RaffleDrawDto, ConfirmWinnerDto, BulkConfirmDto, EligibleCountDto } from './dto/raffle-draw.dto';

@Controller('raffle')
@UseGuards(JwtAuthGuard)
export class RaffleController {
  constructor(private readonly raffleService: RaffleService) {}

  @Get('areas')
  async getAvailableAreas() {
    try {
      const areas = await this.raffleService.getAvailableAreas();
      return {
        success: true,
        data: areas,
        message: 'Available areas retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  @Post('eligible-count')
  @HttpCode(HttpStatus.OK)
  async getEligibleCount(@Body() dto: EligibleCountDto) {
    try {
      const counts = await this.raffleService.getEligibleCount(dto);
      return {
        success: true,
        data: counts,
        message: 'Eligible count retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  @Post('draw')
  async executeDraw(@Body() dto: RaffleDrawDto) {
    try {
      const winners = await this.raffleService.executeDraw(dto);
      return {
        success: true,
        data: {
          winners: winners,
          drawGuid: winners[0]?.drawGuid,
          totalWinners: winners.length,
          prizeName: dto.prizeName
        },
        message: `Successfully selected ${winners.length} winner(s) for ${dto.prizeName}`
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  @Get('winners/:drawGuid')
  async getWinnersByDraw(@Param('drawGuid') drawGuid: string) {
    try {
      const winners = await this.raffleService.getWinnersByDraw(drawGuid);
      return {
        success: true,
        data: winners,
        message: 'Winners retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  @Put('confirm-winner')
  async confirmWinner(@Body() dto: ConfirmWinnerDto) {
    try {
      const result = await this.raffleService.confirmWinner(dto);
      return {
        success: true,
        data: result,
        message: `Winner ${dto.status === 'valid_winner' ? 'confirmed' : 'disqualified'} successfully`
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  @Put('bulk-confirm')
  async bulkConfirmDraw(@Body() dto: BulkConfirmDto) {
    try {
      const result = await this.raffleService.bulkConfirmDraw(dto);
      return {
        success: true,
        data: result,
        message: `All winners ${dto.status === 'valid_winner' ? 'confirmed' : 'disqualified'} successfully`
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  @Get('history')
  async getDrawHistory(@Query('limit') limit?: string) {
    try {
      const history = await this.raffleService.getDrawHistory(
        limit ? parseInt(limit) : 10
      );
      return {
        success: true,
        data: history,
        message: 'Draw history retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  @Get('stats')
  async getDrawStats() {
    try {
      const stats = await this.raffleService.getDrawStats();
      return {
        success: true,
        data: stats,
        message: 'Draw statistics retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }
}