import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
  } from 'typeorm';
  
  @Entity('registrants')
  export class Registrant {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ length: 10 })
    accountNumber: string;
  
    @Column({ length: 50, nullable: true })
    meterNumber: string;
  
    @Column({ length: 250, nullable: true })
    consumerName: string;

    @Column({ length: 250, nullable: true })
    consumerAddress: string;
  
    @Column({ length: 100, nullable: true })
    town: string;
  
    @Column({ length: 100, nullable: true })
    area: string;
  
    @Column({ length: 100, nullable: true })
    district: string;
  
    @CreateDateColumn({ type: 'datetime' })
    registrationTimestamp: Date;
  
    @Column({ type: 'bit', default: false })
    isWinner: boolean;
  
    @Column({ length: 100, nullable: true })
    prizeWon: string;
  
    @Column({ type: 'datetime', nullable: true })
    drawTimestamp: Date;
  
    @Column({ length: 50, default: 'pending' })
    status: string;
  }
  