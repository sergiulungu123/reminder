import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { ScheduleModule } from '@nestjs/schedule';
import { ReminderService } from './app.service';
import { BotUpdate } from './bot.update';
import { session } from 'telegraf';
import { SupabaseService } from './supabase.service';
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
  providers: [ReminderService, BotUpdate, SupabaseService],
})
export class AppModule {}
