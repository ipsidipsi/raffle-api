import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('RaffleAreaCodes')
export class RaffleAreaCode {
  @PrimaryColumn({ length: 10 })
  AreaCode: string;

  @Column({ length: 50, nullable: true })
  Area: string;

  @Column({ type: 'uniqueidentifier', default: () => 'NEWSEQUENTIALID()' })
  rowguid: string;
}