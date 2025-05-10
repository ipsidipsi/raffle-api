import { Controller, Post, Body ,Delete,Param,Get } from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { CreateRegistrantDto } from './dto/create-registrant.dto';

@Controller('registration')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}
   
  @Get('all')
  findAll() {
    return this.registrationService.findAll();
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
