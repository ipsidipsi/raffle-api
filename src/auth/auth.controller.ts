import { Controller, Post, Body,Get,UseGuards,Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';


@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
@UseGuards(JwtAuthGuard)
  @Get('all')
  findAll() {
    return this.authService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('test-protected')
  getProtected() {
  return { message: 'You are authenticated!' };
}

}
