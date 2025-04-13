import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { ScheduleModule } from '@nestjs/schedule';
import { BotUpdate } from './bot.update';
import { session } from 'telegraf';
import { SupabaseService } from './supabase.service';
import { ReminderSchedulerService } from './schedule.service';
// import { reminderWizard } from './reminder.wizard';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TelegrafModule.forRoot({
      token: '7557518463:AAHbMvDOFwDleMQ8zpzcHnn2yAN0EaF1fr0',
      middlewares: [session()],
    }),
    ScheduleModule.forRoot(),
  ],
  exports: [TelegrafModule],
  providers: [ReminderSchedulerService, BotUpdate, SupabaseService],
})
export class AppModule {}
