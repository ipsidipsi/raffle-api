// src/registration/registration.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
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
    // Check if stub exists in registrants table

    const stubs= await this.registrantRepo.findOne({
      where: { stubNumber: dto.stubNumber },
    });
    // Check if account exists in accountmaster

    const account = await this.accountMasterRepo.findOne({
      where: { accountNumber: dto.accountNumber },
    });

    if (!account) {
      throw new NotFoundException('Account number not found in master file');
    }

    // Prevent duplicate registration
    const existing = await this.registrantRepo.findOne({
      where: { accountNumber: dto.accountNumber },
    });

    if (existing) {
      throw new ConflictException('Account already registered');
    }
    if (stubs) {
      throw new ConflictException('Duplicate stub number');
    }

    // Determine area and district from accountmaster fields
    const registrant = this.registrantRepo.create({
      stubNumber: dto.stubNumber,
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
  
  // async searchAccountMaster(term: string): Promise<AccountMaster[]> {
  //   return this.accountMasterRepo.find({
  //     where: [
  //       { accountNumber: Like(`%${term}%`) },
  //      // { meterNumber: Like(`%${term}%`) },
  //      // { consumerName: Like(`%${term}%`) },
  //     ],
  //     take: 10, // Optional: limit results
  //   });
  // }

  // async searchRegistrant(term: string): Promise<Registrant[]> {
  //   return this.registrantRepo.find({
  //     where: [
  //       { accountNumber: Like(`%${term}%`) },
  //      // { meterNumber: Like(`%${term}%`) },
  //      // { consumerName: Like(`%${term}%`) },
  //     ],
  //     take: 10, // Optional: limit results
  //   });
  // }
  
  async searchAccountMaster(field: 'accountNumber' | 'meterNumber' | 'consumerName' = 'accountNumber',term: string, ): Promise<AccountMaster[]> {
    const query = this.accountMasterRepo.createQueryBuilder('accountMaster');

    switch (field) {
      case 'accountNumber':
        query.where('accountMaster.accountNumber LIKE :term', { term: `%${term}%` });
        break;
      case 'meterNumber':
        query.where('accountMaster.meterNumber LIKE :term', { term: `%${term}%` });
        break;
      case 'consumerName':
        query.where('accountMaster.consumerName LIKE :term', { term: `%${term}%` });
        break;
      default:
        throw new Error('Invalid search field');
    }

    const results = await query.take(10).getMany();

    if (results.length === 0) {
      throw new NotFoundException('No results found');
    }

    return results;
  }

  async searchRegistrant( field:'stubNumber' | 'accountNumber' | 'meterNumber' | 'consumerName' = 'accountNumber',term: string,): Promise<Registrant[]> {
    const query = this.registrantRepo.createQueryBuilder('registrant');

    switch (field) {
      case 'stubNumber':
        query.where('registrant.stubNumber LIKE :term', { term: `%${term}%` });
        break;
      case 'accountNumber':
        query.where('registrant.accountNumber LIKE :term', { term: `%${term}%` });
        break;
      case 'meterNumber':
        query.where('registrant.meterNumber LIKE :term', { term: `%${term}%` });
        break;
      case 'consumerName':
        query.where('registrant.consumerName LIKE :term', { term: `%${term}%` });
        break;
      default:
        throw new Error('Invalid search field');
    }

    const results = await query.take(10).getMany();

    if (results.length === 0) {
      throw new NotFoundException('No results found');
    }

    return results;
  }
}
