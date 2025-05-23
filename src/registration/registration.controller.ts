import { Controller, Post, Body ,Delete,Param,Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { CreateRegistrantDto } from './dto/create-registrant.dto';

@Controller('registration')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}
   
  @Get('all')
  findAll() {
    return this.registrationService.findAll();
  }

  @Get('searchAccountMaster')
  async searchAccountMaster(
    @Query('term') term: string,
    @Query('field') field: 'accountNumber' | 'meterNumber' | 'consumerName' = 'accountNumber'
  ) {
    try {
      const results = await this.registrationService.searchAccountMaster(field,term);
      return results;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('searchRegistrant')
  async searchRegistrant(
    @Query('term') term: string,
    @Query('field') field: 'stubNumber' | 'accountNumber' |'accountNumber' | 'meterNumber' | 'consumerName' = 'accountNumber'
  ) {
    try {
      const results = await this.registrationService.searchRegistrant(field,term);
      return results;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

 
  @Post()
  async register(@Body() dto: CreateRegistrantDto) {
    return this.registrationService.register(dto);
  }

  @Delete(':accountNumber')
    async deleteRegistrant(@Param('accountNumber') accountNumber: string) {
    return this.registrationService.deleteRegistrant(accountNumber);
    }


}
