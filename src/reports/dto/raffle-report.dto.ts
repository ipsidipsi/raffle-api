
export class RaffleWinnerDto {
  registrantId: number;
  consumerName: string;
  accountNumber: string;
  areaName: string;
  status: 'confirmed' | 'disqualified' | 'pending';
  confirmedAt?: string;
}

export class RaffleDrawDto {
  id: number;
  drawNumber: string;
  prizeName: string;
  totalWinners: number;
  drawDate: string;
  winners: RaffleWinnerDto[];
}

export class RaffleReportDto {
  raffleDraws: RaffleDrawDto[];
  summary: {
    totalDraws: number;
    totalWinners: number;
    confirmedWinners: number;
    disqualifiedWinners: number;
    pendingWinners: number;
  };
}