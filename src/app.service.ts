import { Injectable } from '@nestjs/common';
// import { Cron, CronExpression } from '@nestjs/schedule';
import { Ctx, InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';

@Injectable()
export class ReminderService {
  constructor(
    // Получаем инстанс Telegram-бота для отправки сообщений
    @InjectBot() private readonly bot: Telegraf<Context>,
  ) {}

  // Пример: отправка напоминания каждые 10 секунд (для демонстрационных целей)
  // @Cron(CronExpression.EVERY_10_SECONDS)
  async handleCron() {
    console.log('Напоминание');
    const chatId = '434811237';
    if (chatId) {
      await this.bot.telegram.sendMessage(
        chatId,
        'Напоменаю: что ты прекрасна:)',
      );
    }
  }

  async handleStart(@Ctx() ctx: Context) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const chatId = ctx?.chat?.id;
    await ctx.reply(`Ваш chat-id: ${chatId}`);
  }
}
