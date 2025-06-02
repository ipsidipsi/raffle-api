// src/raffle/entities/draw.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { Registrant } from '../../registration/entities/registrants.entity';

@Entity('draws')
export class Draw {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uniqueidentifier', default: () => 'NEWID()' })
  drawGuid: string;

  @Column({ length: 100 })
  prizeName: string;

  @Column()
  numberOfWinners: number;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  filterCriteria: string;

  @CreateDateColumn()
  drawTimestamp: Date;

  @Column({ length: 50, nullable: true })
  createdBy: string;

  @Column({ length: 20, default: 'active' })
  status: string;

  @OneToMany(() => Registrant, registrant => registrant.draw)
  winners: Registrant[];
}
