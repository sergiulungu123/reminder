import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseService } from './supabase.service';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

@Injectable()
export class ReminderSchedulerService {
  private readonly logger = new Logger();
  constructor(
    private readonly supabase: SupabaseService,
    @InjectBot() private readonly bot: Telegraf<any>, // ✅ вот это главное
  ) {
    console.log('✅ ReminderScheduler запущен');
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleReminderCheck() {
    const serverDate = new Date().toISOString();
    this.logger.debug(`Server date: ${serverDate}`);
    const reminders = await this.supabase.getDueReminders();

    for (const reminder of reminders) {
      try {
        await this.bot.telegram.sendMessage(
          reminder.chat_id,
          `🔔 Напоминание!\n📝 ${reminder.text}`,
        );

        await this.supabase.markAsDelivered(reminder.id); // 👈 тут обновляем
      } catch (err) {
        console.error('❌ Ошибка при отправке напоминания:', err.message);
      }
    }
  }
}
