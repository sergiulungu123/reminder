import { Injectable } from '@nestjs/common';
// import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectBot, Message, On } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';

@Injectable()
export class ReminderService {
  constructor(
    // Получаем инстанс Telegram-бота для отправки сообщений
    @InjectBot() private readonly bot: Telegraf<Context>,
  ) {}

  // Пример: отправка напоминания каждые 10 секунд (для демонстрационных целей)
  // @Cron(CronExpression.EVERY_10_SECONDS)
  // async handleCron() {
  //   console.log('Напоминание');
  //   const chatId = '434811237';
  //   if (chatId) {
  //     await this.bot.telegram.sendMessage(
  //       chatId,
  //       'Напоменаю: что ты прекрасна:)',
  //     );
  //   }
  // }

  @On('text')
  async onText(@Message('chat.id') chatId: number) {
    console.log('Chat ID:', chatId);
    const id = '434811237';
    await this.bot.telegram.sendMessage(id, 'Test');
  }
}
