export interface AreaInfo {
  AreaCode: string;
  AreaName: string;
  TotalRegistrants: number;
  EligibleRegistrants: number;
}

export interface EligibleCount {
  area: string;
  AreaName: string;
  EligibleCount: number;
}

export interface DrawResult {
  id: number;
  accountNumber: string;
  consumerName: string;
  consumerAddress: string;
  area: string;
  AreaName: string;
  prizeWon: string;
  drawTimestamp: Date;
  status: string;
  drawGuid: string;
}

export interface WinnerConfirmationResult {
  RowsAffected: number;
  Result: string;
}