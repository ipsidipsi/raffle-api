import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  //  private configService: ConfigService
  ) {}

  async register(username: string, password: string, role: 'user' | 'admin' = 'user') {
    const existing = await this.usersRepository.findOne({ where: { username } });
    if (existing) {
      throw new Error('Username already exists');
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({ username, password: hashed, role });
    return this.usersRepository.save(user);
  }

  async login(username: string, password: string) {
    const user = await this.usersRepository.findOne({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // In real use: return JWT token here
    return {
      message: 'Login successful',
      user: { id: user.id, username: user.username, role: user.role },
    };
  }

  async findAll() {
    return this.usersRepository.find();
  }

  
}
