// src/reports/reports.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Registrant } from '../registration/entities/registrants.entity';
import { RaffleAreaCode } from '../raffle/entities/raffle-area-code.entity';
import { Draw } from '../raffle/entities/draw.entity';
import * as XLSX from 'xlsx';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Registrant)
    private registrantRepo: Repository<Registrant>,
    
    @InjectRepository(RaffleAreaCode)
    private raffleAreaCodeRepo: Repository<RaffleAreaCode>,

    @InjectRepository(Draw)
    private drawRepo: Repository<Draw>,
  ) {}

  async getRegistrantReport() {
    // Get total registrants count
    const totalRegistrants = await this.registrantRepo.count();
    
    // Get registrants by area with area details
    // Join registrant.area (string) with RaffleAreaCode.AreaCode
    const registrantsByArea = await this.registrantRepo
      .createQueryBuilder('registrant')
      .leftJoin(RaffleAreaCode, 'areaCode', 'registrant.area = areaCode.AreaCode')
      .select([
        'registrant.area as areaCode',
        'areaCode.Area as areaName',
        'COUNT(registrant.id) as registrantCount'
      ])
      .groupBy('registrant.area, areaCode.Area')
      .orderBy('registrant.area')
      .getRawMany();

    // Ensure we have all 15 predefined areas (fill with 0 if no registrants)
    const predefinedAreas = await this.raffleAreaCodeRepo.find({
      order: { AreaCode: 'ASC' }
    });

    const areaBreakdown = predefinedAreas.map(area => {
      const found = registrantsByArea.find(r => r.areaCode === area.AreaCode);
      return {
        areaCode: area.AreaCode,
        areaName: area.Area,
        registrantCount: found ? parseInt(found.registrantCount) : 0
      };
    });

    return {
      totalRegistrants,
      areaBreakdown,
      lastUpdated: new Date().toISOString()
    };
  }

  async getRegistrantsByArea() {
    return this.registrantRepo
      .createQueryBuilder('registrant')
      .leftJoin(RaffleAreaCode, 'areaCode', 'registrant.area = areaCode.AreaCode')
      .select([
        'registrant.area as areaCode',
        'areaCode.Area as areaName',
        'COUNT(registrant.id) as count'
      ])
      .groupBy('registrant.area, areaCode.Area')
      .orderBy('registrant.area')
      .getRawMany();
  }

  async getRaffleReport() {
    // Get all draws with their winners and area information
    const draws = await this.drawRepo
      .createQueryBuilder('draw')
      .leftJoinAndSelect('draw.winners', 'winner')
      .leftJoin(RaffleAreaCode, 'areaCode', 'winner.area = areaCode.AreaCode')
      .addSelect('areaCode.Area', 'areaName')
      .orderBy('draw.drawTimestamp', 'DESC')
      .getMany();

    // Get area names separately for mapping
    const areaMap = new Map();
    const allAreas = await this.raffleAreaCodeRepo.find();
    allAreas.forEach(area => {
      areaMap.set(area.AreaCode, area.Area);
    });

    // Transform the data for the report
    const raffleDraws = draws.map(draw => ({
      id: draw.id,
      drawGuid: draw.drawGuid,
      drawNumber: `DRAW-${draw.id.toString().padStart(3, '0')}`,
      prizeName: draw.prizeName,
      totalWinners: draw.winners?.length || 0,
      numberOfWinners: draw.numberOfWinners,
      drawDate: draw.drawTimestamp.toISOString(),
      filterCriteria: draw.filterCriteria,
      createdBy: draw.createdBy,
      status: draw.status,
      winners: draw.winners?.map(winner => ({
        registrantId: winner.id,
        stubNumber: winner.stubNumber,
        consumerName: winner.consumerName,
        accountNumber: winner.accountNumber,
        areaCode: winner.area,
        areaName: areaMap.get(winner.area) || winner.area,
        meterNumber: winner.meterNumber,
        consumerAddress: winner.consumerAddress,
        town: winner.town,
        district: winner.district,
        status: winner.status,
        prizeWon: winner.prizeWon,
        isWinner: winner.isWinner,
        confirmedAt: winner.drawTimestamp?.toISOString() || null,
        registrationTimestamp: winner.registrationTimestamp.toISOString()
      })) || []
    }));

    // Calculate summary statistics
    const totalDraws = draws.length;
    const allWinners = draws.flatMap(draw => draw.winners || []);
    const totalWinners = allWinners.length;
    const confirmedWinners = allWinners.filter(w => w.status === 'confirmed').length;
    const disqualifiedWinners = allWinners.filter(w => w.status === 'disqualified' || w.status === 'invalid').length;
    const pendingWinners = allWinners.filter(w => w.status === 'pending').length;
    const validWinners = allWinners.filter(w => w.status === 'valid_winner').length;

    return {
      raffleDraws,
      summary: {
        totalDraws,
        totalWinners,
        confirmedWinners,
        disqualifiedWinners,
        pendingWinners,
        validWinners
      }
    };
  }

  async exportRaffleData(format: 'excel' | 'csv') {
    const raffleData = await this.getRaffleReport();
    
    // Flatten data for export - each row represents one winner
    const exportRows: any[] = [];
    
    raffleData.raffleDraws.forEach(draw => {
      draw.winners?.forEach(winner => {
        exportRows.push({
          'Draw ID': draw.id,
          'Draw GUID': draw.drawGuid,
          'Draw Number': draw.drawNumber,
          'Prize Name': draw.prizeName,
          'Draw Date': new Date(draw.drawDate).toLocaleDateString(),
          'Filter Criteria': draw.filterCriteria || '',
          'Created By': draw.createdBy || '',
          'Draw Status': draw.status,
          'Total Winners in Draw': draw.totalWinners,
          'Expected Winners': draw.numberOfWinners,
          'Winner ID': winner.registrantId,
          'Stub Number': winner.stubNumber,
          'Consumer Name': winner.consumerName,
          'Account Number': winner.accountNumber,
          'Meter Number': winner.meterNumber || '',
          'Address': winner.consumerAddress || '',
          'Town': winner.town || '',
          'Area Code': winner.areaCode,
          'Area Name': winner.areaName,
          'District': winner.district || '',
          'Winner Status': winner.status,
          'Prize Won': winner.prizeWon || '',
          'Is Winner': winner.isWinner ? 'Yes' : 'No',
          'Registration Date': new Date(winner.registrationTimestamp).toLocaleDateString(),
          'Draw Confirmation Date': winner.confirmedAt ? new Date(winner.confirmedAt).toLocaleDateString() : ''
        });
      });
    });

    // Add summary row
    if (exportRows.length > 0) {
      const summaryRow: any = {
        'Draw ID': 'SUMMARY',
        'Draw Number': `Total Draws: ${raffleData.summary.totalDraws}`,
        'Prize Name': `Total Winners: ${raffleData.summary.totalWinners}`,
        'Consumer Name': `Confirmed: ${raffleData.summary.confirmedWinners}`,
        'Account Number': `Valid: ${raffleData.summary.validWinners}`,
        'Area Name': `Disqualified: ${raffleData.summary.disqualifiedWinners}`,
        'Winner Status': `Pending: ${raffleData.summary.pendingWinners}`
      };

      // Fill remaining columns with empty strings
      Object.keys(exportRows[0]).forEach(key => {
        if (!(key in summaryRow)) {
          summaryRow[key] = '';
        }
      });

      exportRows.push(summaryRow);
    }

    if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(exportRows);
      
      // Auto-size columns
      const colWidths = Object.keys(exportRows[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      ws['!cols'] = colWidths;
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Raffle Report');
      
      // Add summary sheet
      const summaryData = [
        { Metric: 'Total Draws', Value: raffleData.summary.totalDraws },
        { Metric: 'Total Winners', Value: raffleData.summary.totalWinners },
        { Metric: 'Confirmed Winners', Value: raffleData.summary.confirmedWinners },
        { Metric: 'Valid Winners', Value: raffleData.summary.validWinners },
        { Metric: 'Disqualified Winners', Value: raffleData.summary.disqualifiedWinners },
        { Metric: 'Pending Winners', Value: raffleData.summary.pendingWinners }
      ];
      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
      
      return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    } else {
      // CSV format
      if (exportRows.length === 0) {
        return 'No raffle data available';
      }
      
      const headers = Object.keys(exportRows[0]).join(',');
      const rows = exportRows.map(row => 
        Object.values(row).map(value => {
          const stringValue = String(value || '');
          return stringValue.includes(',') || stringValue.includes('"') 
            ? `"${stringValue.replace(/"/g, '""')}"` 
            : stringValue;
        }).join(',')
      );
      
      return [headers, ...rows].join('\n');
    }
  }

  // Helper method for real-time updates
  async getRegistrantStats() {
    const total = await this.registrantRepo.count();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCount = await this.registrantRepo
      .createQueryBuilder('registrant')
      .where('registrant.registrationTimestamp >= :today', { today })
      .getCount();

    return {
      total,
      todayCount,
      lastUpdated: new Date().toISOString()
    };
  }
}