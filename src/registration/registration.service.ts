// src/registration/registration.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Registrant } from './entities/registrants.entity';
import { CreateRegistrantDto } from './dto/create-registrant.dto';
import { AccountMaster } from '../accountmaster/entities/accountmaster.entity';

@Injectable()
export class RegistrationService {
  constructor(
    @InjectRepository(Registrant)
    private readonly registrantRepo: Repository<Registrant>,

    @InjectRepository(AccountMaster)
    private readonly accountMasterRepo: Repository<AccountMaster>,
  ) {}

  async register(dto: CreateRegistrantDto) {
    // Check if account exists in accountmaster
    const account = await this.accountMasterRepo.findOne({
      where: { accountNumber: dto.accountNumber },
    });

    if (!account) {
      throw new NotFoundException('Account number not found');
    }

    // Prevent duplicate registration
    const existing = await this.registrantRepo.findOne({
      where: { accountNumber: dto.accountNumber },
    });

    if (existing) {
      throw new ConflictException('Account already registered');
    }

    // Determine area and district from accountmaster fields
    const registrant = this.registrantRepo.create({
      accountNumber: account.accountNumber,
      meterNumber: account.meterNumber,
      consumerName: account.consumerName,
      consumerAddress: account.consumerAddress,
      area: account.area,
      //district: account.municipalityCode,
      isWinner: false,
      status: 'pending',
    });

    return this.registrantRepo.save(registrant);
  }

  // src/registration/registration.service.ts
async deleteRegistrant(accountNumber: string): Promise<string> {
    const existing = await this.registrantRepo.findOne({
      where: { accountNumber },
    });
  
    if (!existing) {
      throw new Error('Registrant not found');
    }
  
    await this.registrantRepo.remove(existing);
    return `Registrant with account number ${accountNumber} deleted.`;
  }
  
  async findAll(){
    return this.registrantRepo.find();
  }
}
