import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { ScheduleModule } from '@nestjs/schedule';
import { ReminderService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Инициализируем модуль Telegram с помощью токена из переменных окружения
    TelegrafModule.forRoot({
      token: '7557518463:AAHbMvDOFwDleMQ8zpzcHnn2yAN0EaF1fr0',
    }),
    // Инициализируем планировщик задач NestJS
    ScheduleModule.forRoot(),
  ],
  providers: [ReminderService],
})
export class AppModule {}
