import { Context as TelegrafContext } from 'telegraf';

export interface ReminderSession {
  reminderMessageIds: any;
  step?: 'awaiting_time' | 'awaiting_text';
  time?: string;
}

export interface BotContext extends TelegrafContext {
  session: ReminderSession;
}
