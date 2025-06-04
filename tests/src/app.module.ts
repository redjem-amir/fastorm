import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FastOrmModule } from 'nestjs-fastorm';
import { SimpleTable } from './models/simple-table.model';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    FastOrmModule.forRoot({
      host: process.env.POSTGRES_HOST,
      port: 5432,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      synchronize: true,
      entities: [
        SimpleTable
      ],
    }),
    FastOrmModule.forFeature([
      SimpleTable
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }