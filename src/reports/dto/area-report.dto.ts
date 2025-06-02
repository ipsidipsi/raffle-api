export class AreaReportDto {
  areaCode: string;
  areaName: string;
  registrantCount: number;
}

export class RegistrantReportDto {
  totalRegistrants: number;
  areaBreakdown: AreaReportDto[];
  lastUpdated: string;
}