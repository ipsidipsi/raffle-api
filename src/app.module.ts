import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type:'mssql',
     host: process.env.DB_HOST,
     port: parseInt(process.env.DB_PORT ?? '1433'),
     username: process.env.DB_USERNAME,
     password: process.env.DB_PASSWORD,
     database: process.env.DB_DATABASE,
     autoLoadEntities: true,
     entities: [__dirname + '/**/*.ts'],
     synchronize: false,
     options: {
       //encrypt: true,
       enableArithAbort: true,
       trustServerCertificate: true,
     },
     
    }),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
