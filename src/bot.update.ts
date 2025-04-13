import { Update, Start, Ctx, Hears, On } from 'nestjs-telegraf';
import { BotContext } from './bot.context';
import { Message } from 'telegraf/typings/core/types/typegram';
import { SupabaseService } from './supabase.service';

@Update()
export class BotUpdate {
  constructor(private readonly supabase: SupabaseService) {}
  @Start()
  async onStart(@Ctx() ctx: BotContext) {
    ctx.session.step = undefined;
    ctx.session.time = undefined;

    await ctx.reply('Привет! Что хотите сделать?', {
      reply_markup: {
        keyboard: [
          [
            { text: '➕ Добавить напоминание' },
            { text: '🔔 Посмотреть все напоминания' },
          ],
        ],
        resize_keyboard: true,
      },
    });
  }

  @Hears('➕ Добавить напоминание')
  async onAddReminder(@Ctx() ctx: BotContext) {
    ctx.session.step = 'awaiting_time';
    ctx.session.time = undefined;
    await ctx.reply('Введите время (например 15:30 12/12/2023)');
  }

  @Hears('🔔 Посмотреть все напоминания')
  async onViewReminders(@Ctx() ctx: BotContext) {
    const reminders = await this.supabase.getReminders(ctx.chat!.id);
    if (!reminders.length) {
      return await ctx.reply('📭 Напоминаний пока нет.');
    }

    const message = reminders.map((r) => `🕒 ${r.date} — ${r.text}`).join('\n');

    await ctx.reply(`🔔 Ваши напоминания:\n\n${message}`);
  }

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    const { session, message } = ctx;

    // Гарантируем, что это текст
    const msg = message as Message.TextMessage;
    const text = msg.text;

    // Игнорируем команды, если мы не в процессе добавления
    if (!session.step) return;

    if (session.step === 'awaiting_time') {
      session.time = text;
      session.step = 'awaiting_text';
      await ctx.reply('Введите текст напоминания');
      return;
    }

    if (session.step === 'awaiting_text' && session.time) {
      const reminderText = text;
      const reminderTime = session.time;

      const raw = reminderTime; // например: "15:30 12/12/2023"
      const [timePart, datePart] = raw.split(' '); // "15:30", "12/12/2023"
      const [day, month, year] = datePart.split('/');

      const isoDatetime = `${year}-${month}-${day}T${timePart}:00`;

      await this.supabase.addReminder(ctx.chat!.id, isoDatetime, text);
      await ctx.reply(
        `✅ Напоминание установлено:\n🕒 Время: ${reminderTime}\n📝 Текст: ${reminderText}`,
      );

      session.step = undefined;
      session.time = undefined;
      return;
    }
  }
}
