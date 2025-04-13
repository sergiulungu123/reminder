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
  async onText(
    @Message('text') text: string,
    @Message('chat.id') chatId: number,
  ) {
    console.log('Received message:', text);
    await this.bot.telegram.sendMessage(chatId, 'Echo: ' + text);
  }
}
