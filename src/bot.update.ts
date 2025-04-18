import { Update, Start, Ctx, Hears, On, Action } from 'nestjs-telegraf';
import { BotContext } from './bot.context';
import { Message } from 'telegraf/typings/core/types/typegram';
import { SupabaseService } from './supabase.service';
import dayjs from 'dayjs';
import { Markup } from 'telegraf';

const FULL_DATE_TIME =
  /^([01]\d|2[0-3]):([0-5]\d)\s(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
const SHORT_DATE_TIME =
  /^([01]\d|2[0-3]):([0-5]\d)\s(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])$/;

@Update()
export class BotUpdate {
  constructor(private readonly supabase: SupabaseService) {}

  @Start()
  async onStart(@Ctx() ctx: BotContext) {
    // resetăm sesiunea și lista de IDs
    ctx.session.step = undefined;
    ctx.session.time = undefined;
    ctx.session.reminderMessageIds = [];
    ctx.session.reminderMessageIds.push(ctx.message?.message_id);

    // afișăm meniul și lista (capturăm reply-urile în showMainMenu și showReminders)
    await this.showMainMenu(ctx);
    await this.showReminders(ctx);
  }

  @Hears('➕ Добавить напоминание')
  async onAddReminder(@Ctx() ctx: BotContext) {
    // capturăm ID-ul user-ului
    const incoming = ctx.message as Message.TextMessage;
    ctx.session.reminderMessageIds ??= [];
    ctx.session.reminderMessageIds.push(incoming.message_id);

    ctx.session.step = 'awaiting_time';
    ctx.session.time = undefined;

    const exampleDate = dayjs().format('HH:mm DD/MM/YYYY');
    const m = await ctx.reply(
      `⏰ Введите время и дату в формате:\n<code>${exampleDate}</code>`,
      { parse_mode: 'HTML' },
    );
    ctx.session.reminderMessageIds.push(m.message_id);
  }

  @Hears('🔔 Посмотреть все напоминания')
  async onViewReminders(@Ctx() ctx: BotContext) {
    // capturăm ID-ul user-ului
    const incoming = ctx.message as Message.TextMessage;
    ctx.session.reminderMessageIds ??= [];
    ctx.session.reminderMessageIds.push(incoming.message_id);

    ctx.session.step = undefined;
    ctx.session.time = undefined;
    await this.showReminders(ctx);
  }

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    const msg = ctx.message as Message.TextMessage;
    // capturăm ID-ul user-ului
    ctx.session.reminderMessageIds ??= [];
    ctx.session.reminderMessageIds.push(msg.message_id);

    const { session } = ctx;
    if (!session.step) return;

    const text = msg.text;

    // pasul 1: validare dată/oră
    if (session.step === 'awaiting_time') {
      if (!this.validateTimeInput(text)) {
        const exampleDate = dayjs().add(1, 'hour').format('HH:mm DD/MM/YYYY');
        const err = await ctx.reply(
          `❌ Неверный формат. Пример:\n<code>${exampleDate}</code>`,
          { parse_mode: 'HTML' },
        );
        ctx.session.reminderMessageIds.push(err.message_id);
        return;
      }
      session.time = text;
      session.step = 'awaiting_text';
      const prompt = await ctx.reply('✍️ Теперь введите текст напоминания');
      ctx.session.reminderMessageIds.push(prompt.message_id);
      return;
    }

    // pasul 2: textul reminder-ului
    if (session.step === 'awaiting_text' && session.time) {
      const [timePart, datePart] = session.time.split(' ');
      const [day, month, year] = datePart.split('/');
      const iso = `${year}-${month}-${day}T${timePart}:00`;

      await this.supabase.addReminder(ctx.chat!.id, iso, text);

      // reset sesiune
      session.step = undefined;
      session.time = undefined;

      // reafișăm lista
      await this.showReminders(ctx);
    }
  }

  @Action(/delete_.+/)
  async onDeleteReminder(@Ctx() ctx: BotContext) {
    // nu capturăm aici pentru că e callbackQuery, nu mesaj text direct
    const data = 'data' in ctx.callbackQuery! ? ctx.callbackQuery.data : null;
    if (!data?.startsWith('delete_')) return;

    const id = data.replace('delete_', '');
    try {
      await this.supabase.deleteReminder(id);
      await ctx.answerCbQuery('Удалено ✅');
      await this.showReminders(ctx);
    } catch (err) {
      await ctx.answerCbQuery('Ошибка ❌', { show_alert: true });
      console.error(err);
    }
  }

  // ————————————
  // Helpers

  /** Trimite meniul principal și capturează reply-ul */
  private async showMainMenu(ctx: BotContext) {
    await ctx.reply('📋 Активные напоминания:', {
      reply_markup: {
        keyboard: [
          [{ text: '➕ Добавить напоминание' }],
          [{ text: '🔔 Посмотреть все напоминания' }],
        ],
        resize_keyboard: true,
      },
    });
    ctx.session.reminderMessageIds ??= [];
  }

  /** Afișează reminderele și șterge toate vechile mesaje (user+bot) */
  private async showReminders(ctx: BotContext) {
    const chatId = ctx.chat!.id;
    const prevIds: number[] = ctx.session.reminderMessageIds || [];

    // Ștergem mesajele anterioare
    await Promise.all(
      prevIds.map((msgId) => ctx.deleteMessage(msgId).catch(() => null)),
    );

    // Obținem lista de remindere
    const list = await this.supabase.getReminders(chatId);
    const newIds: number[] = [];

    if (list.length === 0) {
      const emptyMsg = await ctx.reply('📭 *Пока что нет напоминаний*', {
        parse_mode: 'Markdown',
      });
      newIds.push(emptyMsg.message_id);
    } else {
      for (const reminder of list) {
        const date = new Date(reminder.date);
        const formattedDate = date.toLocaleDateString('ru-Ru', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        const text =
          `<b>📅 Дата:</b> <i>${formattedDate}</i>\n` +
          `<b>📝 Описание:</b> <i>${reminder.text}</i>\n\n`;

        const message = await ctx.replyWithHTML(text, {
          reply_markup: Markup.inlineKeyboard([
            Markup.button.callback('🗑 Удалить', `delete_${reminder.id}`),
          ]).reply_markup,
        });
        newIds.push(message.message_id);
      }
    }

    ctx.session.reminderMessageIds = newIds;
  }

  /** Validare format HH:mm DD/MM/YYYY sau HH:mm DD/MM */
  private validateTimeInput(text: string): boolean {
    return FULL_DATE_TIME.test(text) || SHORT_DATE_TIME.test(text);
  }
}
