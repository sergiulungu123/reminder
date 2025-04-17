import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { ScheduleModule } from '@nestjs/schedule';
import { session } from 'telegraf';
import { configArray, environmentSchema } from './config';
import { BotUpdate } from './bot.update';
import { SupabaseService } from './supabase.service';
import { ReminderSchedulerService } from './schedule.service';
// import { reminderWizard } from './reminder.wizard';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: environmentSchema,
      load: configArray,
      envFilePath: '.env',
    }),
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        token: config.get<string>('BOT_TOKEN')!,
        middlewares: [session()],
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
  ],
  exports: [TelegrafModule],
  providers: [ReminderSchedulerService, BotUpdate, SupabaseService],
})
export class AppModule {}
