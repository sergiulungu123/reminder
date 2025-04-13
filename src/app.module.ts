import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { ScheduleModule } from '@nestjs/schedule';
import { ReminderService } from './app.service';
import { BotUpdate } from './bot.update';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TelegrafModule.forRoot({
      token: '7557518463:AAHbMvDOFwDleMQ8zpzcHnn2yAN0EaF1fr0',
    }),
    ScheduleModule.forRoot(),
  ],
  providers: [ReminderService, BotUpdate],
})
export class AppModule {}
