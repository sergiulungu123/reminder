import { Ctx, On, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';

@Update()
export class BotUpdate {
  @On('text')
  async onText(@Ctx() ctx: Context) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const chatId = ctx?.chat?.id;

    if (!chatId) {
      console.error('❌ Chat ID not found');
      return;
    }

    console.log('✅ Got chat ID:', chatId);
    await ctx.telegram.sendMessage(chatId, 'Test ✅');
  }
}
