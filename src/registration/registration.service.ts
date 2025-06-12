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

  async findAll(
  limit: number = 20, 
  offset: number = 0,
  filterType?: string,
  filterValue?: string
) {
  // Add safety limits
  const safeLimit = Math.min(Math.max(limit, 1), 100); // Between 1-100
  const safeOffset = Math.max(offset, 0); // No negative offset

 const query = this.registrantRepo.createQueryBuilder('registrant')
    
    .orderBy('registrant.registrationTimestamp', 'DESC') // Then by timestamp
    .addOrderBy('registrant.stubNumber', 'ASC'); // Order by stub number first

   // Apply filtering with exact/starts-with logic
  if (filterType && filterValue && filterValue.trim()) {
    const searchTerm = filterValue.trim();
    
    switch (filterType.toLowerCase()) {
      case 'stubnumber':
        // Exact match for stub numbers
        query.andWhere('registrant.stubNumber = :exactTerm', { exactTerm: searchTerm });
        break;
      case 'accountnumber':
        // Starts with for account numbers
        query.andWhere('registrant.accountNumber LIKE :startsWithTerm', { startsWithTerm: `${searchTerm}%` });
        break;
      case 'consumername':
      case 'accountname':
        // Contains for names
        query.andWhere('registrant.consumerName LIKE :containsTerm', { containsTerm: `%${searchTerm}%` });
        break;
      default:
        // Search across all fields
        query.andWhere(
          '(registrant.stubNumber = :exactTerm OR registrant.accountNumber LIKE :startsWithTerm OR registrant.consumerName LIKE :containsTerm)',
          { 
            exactTerm: searchTerm,
            startsWithTerm: `${searchTerm}%`,
            containsTerm: `%${searchTerm}%`
          }
        );
    }
  }
  // Apply pagination
  query.take(safeLimit).skip(safeOffset);

  // Get both data and total count
  const [registrants, total] = await query.getManyAndCount();

  return {
    registrants,
    total,
    page: Math.floor(safeOffset / safeLimit) + 1,
    totalPages: Math.ceil(total / safeLimit),
    hasMore: safeOffset + safeLimit < total,
    limit: safeLimit,
    offset: safeOffset,
    filter: filterType && filterValue ? { type: filterType, value: filterValue } : null
  };
}
  // async findAll(){
  //   return this.registrantRepo.find({
  //     order:{
  //       registrationTimestamp: 'DESC'
  //     }
  //   }
  //   );
  // }
  
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
        query.where('accountMaster.accountNumber LIKE :term', { term: `${term}%` })
        .orderBy('accountMaster.accountNumber', 'ASC');
        break;
      case 'meterNumber':
        query.where('accountMaster.meterNumber LIKE :term', { term: `${term}%` });
        break;
      case 'consumerName':
        query.where('accountMaster.consumerName LIKE :term', { term: `${term}%` })
        .orderBy('accountMaster.consumerName', 'ASC');
        break;
      default:
        throw new Error('Invalid search field');
    }

    const results = await query.take(5).getMany();

    if (results.length === 0) {
      throw new NotFoundException('No results found');
    }

    return results;
  }

  async searchRegistrant( field:'stubNumber' | 'accountNumber' | 'meterNumber' | 'consumerName' = 'accountNumber',term: string,): Promise<Registrant[]> {
    const query = this.registrantRepo.createQueryBuilder('registrant');

    switch (field) {
      case 'stubNumber':
        query.where('registrant.stubNumber LIKE :term', { term: `${term}%` })
        //.orderBy('registrant.stubNumber');
        break;
      case 'accountNumber':
        query.where('registrant.accountNumber LIKE :term', { term: `${term}%` })
       // .orderBy('registrant.registrationTimestamp', 'DESC');
        break;
      case 'meterNumber':
        query.where('registrant.meterNumber LIKE :term', { term: `${term}%` });
        break;
      case 'consumerName':
        query.where('registrant.consumerName LIKE :term', { term: `${term}%` })
        //.orderBy('registrant.registrationTimestamp', 'DESC');
        break;
      default:
        throw new Error('Invalid search field');
    }

    const results = await query.take(5).getMany();

    if (results.length === 0) {
      throw new NotFoundException('No results found');
    }

    return results;
  }
}
