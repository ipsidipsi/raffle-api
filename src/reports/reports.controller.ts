import { 
  Controller, 
  Get, 
  UseGuards, 
  Request,
  Query,
  Res,
  BadRequestException 
} from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('registrants')
  async getRegistrantReport() {
    return this.reportsService.getRegistrantReport();
  }

  @Get('registrants/by-area')
  async getRegistrantsByArea() {
    return this.reportsService.getRegistrantsByArea();
  }

  // Admin-only endpoints
  @Get('raffle')
  async getRaffleReport(@Request() req) {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw new BadRequestException('Access denied. Admin role required.');
    }
    return this.reportsService.getRaffleReport();
  }

  @Get('raffle/export')
  async exportRaffleReport(
    @Request() req,
    @Query('format') format: 'excel' | 'csv' = 'excel',
    @Res() res: Response
  ) {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      throw new BadRequestException('Access denied. Admin role required.');
    }

    const exportData = await this.reportsService.exportRaffleData(format);
    
    if (format === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=raffle-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=raffle-report-${new Date().toISOString().split('T')[0]}.csv`);
    }
    
    res.send(exportData);
  }
}