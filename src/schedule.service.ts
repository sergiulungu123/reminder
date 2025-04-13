import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SupabaseService } from './supabase.service';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

@Injectable()
export class ReminderSchedulerService {
  constructor(
    private readonly supabase: SupabaseService,
    @InjectBot() private readonly bot: Telegraf<any>, // ✅ вот это главное
  ) {
    console.log('✅ ReminderScheduler запущен');
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleReminderCheck() {
    const now = new Date();
    console.log(now);
    const reminders = await this.supabase.getDueReminders();

    for (const reminder of reminders) {
      try {
        await this.bot.telegram.sendMessage(
          reminder.chat_id,
          `🔔 Напоминание!\n🕒 ${reminder.date}\n📝 ${reminder.text}`,
        );

        await this.supabase.markAsDelivered(reminder.id); // 👈 тут обновляем
      } catch (err) {
        console.error('❌ Ошибка при отправке напоминания:', err.message);
      }
    }
  }
}
