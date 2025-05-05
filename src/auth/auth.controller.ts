import { Controller, Post, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { username: string; password: string; role?: string }) {
    const validRoles = ['user', 'admin'];
    const role = validRoles.includes(body.role ?? '') ? body.role! : 'user';
    return this.authService.register(body.username, body.password, role as 'user' | 'admin');
  }

  @Post('login')
  async login(@Body() body: { username: string; password: string }) {
    return this.authService.login(body.username, body.password);
  }

  @Get('all')
  findAll() {
    return this.authService.findAll();
  }
}
