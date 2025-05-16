import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RegistrationModule } from './registration/registration.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type:'mssql',
     host: process.env.DB_HOST,
     port: parseInt(process.env.DB_PORT ?? '1433'),
     username: process.env.DB_USERNAME,
     password: process.env.DB_PASSWORD,
     database: process.env.DB_DATABASE,
    // host: 'localhost',
    //  port: 1433,
    //  username: 'sa',
    //  password: 'Iselc01S3rv3r',
    //  database: 'UBMS',
     autoLoadEntities: true,
     entities: [__dirname + '/**/*.ts'],
     synchronize: false,
     options: {
       encrypt: false,
       enableArithAbort: true,
       trustServerCertificate: false,
     },
     extra: {
      trustServerCertificate: false,
      encrypt: false
     },
     requestTimeout: 30000,
    }),
    AuthModule,
    RegistrationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
