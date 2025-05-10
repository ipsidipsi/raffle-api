import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationService } from './registration.service';
import { RegistrationController } from './registration.controller';
import { Registrant } from './entities/registrants.entity';
import { AccountMaster } from '../accountmaster/entities/accountmaster.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Registrant, AccountMaster])],
  controllers: [RegistrationController],
  providers: [RegistrationService],
})
export class RegistrationModule {}
