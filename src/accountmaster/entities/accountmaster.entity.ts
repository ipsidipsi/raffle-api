// src/accountmaster/entities/accountmaster.entity.ts
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('accountmaster')
export class AccountMaster {
  @PrimaryColumn({ length: 50 })
  accountNumber: string;

  @Column({ length: 50, nullable: true })
  meterNumber: string;

  @Column({ length: 150 })
  consumerName: string;

  @Column()
  consumerAddress:string;

  @Column()
  area:string;

 // @Column({ length: 255, nullable: true })
  district: string; // to determine district

 // @Column({ length: 255, nullable: true })
  areaCode: string; // to determine area
}
