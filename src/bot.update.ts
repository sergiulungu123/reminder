import { Update, Start, Ctx, Hears, On, Action } from 'nestjs-telegraf';
import { BotContext } from './bot.context';
import { Message } from 'telegraf/typings/core/types/typegram';
import { SupabaseService } from './supabase.service';
import { Markup } from 'telegraf';
import dayjs from 'dayjs';
const FULL_DATE_TIME =
  /^([01]\d|2[0-3]):([0-5]\d)\s(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
const SHORT_DATE_TIME =
  /^([01]\d|2[0-3]):([0-5]\d)\s(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])$/;

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
    const exampleDate = dayjs().format('HH:mm DD/MM/YYYY');
    await ctx.reply(
      `⏰ Введите время и дату в формате:\n<code>${exampleDate}</code>\n`,
      { parse_mode: 'HTML' },
    );
  }

  @Hears('🔔 Посмотреть все напоминания')
  async onViewReminders(@Ctx() ctx: BotContext) {
    const chatId = ctx.chat!.id;
    const reminders = await this.supabase.getReminders(chatId);

    if (!reminders.length) {
      await ctx.reply('📭 Напоминаний пока нет.');
      return;
    }

    for (const reminder of reminders) {
      const formatted = dayjs(reminder.date).format('HH:mm DD.MM.YYYY');

      const message = `🕒 ${formatted}\n📝 ${reminder.text}`;
      await ctx.reply(
        message,
        Markup.inlineKeyboard([
          [Markup.button.callback('🗑 Удалить', `delete_${reminder.id}`)],
        ]),
      );
    }
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
      if (!this.validateTimeInput(text)) {
        const exampleDate = dayjs().add(1, 'hour').format('HH:mm DD/MM/YYYY');
        await ctx.reply(
          `❌ Неверный формат времени. Пример формата:\n<code>${exampleDate}</code>\n`,
          { parse_mode: 'HTML' },
        );
        return;
      }
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

  @Action(/delete_.+/)
  async onDeleteReminder(@Ctx() ctx: BotContext) {
    // eslint-disable-next-line no-unsafe-optional-chaining, @typescript-eslint/no-non-null-asserted-optional-chain
    const data = 'data' in ctx?.callbackQuery! ? ctx.callbackQuery.data : null;

    if (!data || !data.startsWith('delete_')) return;

    const id = data.replace('delete_', '');

    try {
      await this.supabase.deleteReminder(id);
      await ctx.answerCbQuery('Удалено ✅');
      await ctx.editMessageText('❌ Напоминание удалено');
    } catch (err) {
      await ctx.answerCbQuery('Ошибка при удалении ❌', { show_alert: true });
      console.error('Ошибка при удалении напоминания:', err);
    }
  }

  private validateTimeInput(text: string): boolean {
    return FULL_DATE_TIME.test(text) || SHORT_DATE_TIME.test(text);
  }
}
