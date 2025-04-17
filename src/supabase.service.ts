import { Inject, Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import { ConfigType } from '@nestjs/config';
import appConfig from './config/app.config';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient;
  constructor(
    @Inject(appConfig.KEY)
    private readonly conf: ConfigType<typeof appConfig>,
  ) {
    this.client = createClient(this.conf.supabaseUrl, this.conf.supabaseToken);
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  async addReminder(chatId: number, date: string, text: string) {
    const raw = date; // "15:30 13/04/2025"
    // Дата в формате "DD/MM/YYYY HH:mm"
    const format = 'HH:mm DD/MM/YYYY';
    const tz = 'Europe/Chisinau';

    const parsed = dayjs.tz(raw, format, tz);
    const nowChisinau = dayjs(date);
    if (!parsed.isValid()) {
      throw new Error(`Invalid date format: "${raw}"`);
    }

    const isoUtc = nowChisinau.utc().toISOString();

    const { error } = await this.client.from('reminders').insert({
      chat_id: chatId,
      date: isoUtc,
      text,
    });

    if (error) {
      throw new Error(`Failed to add reminder: ${error.message}`);
    }
  }

  async getReminders(
    chatId: number,
  ): Promise<{ id: string; chat_id: number; text: string; date: string }[]> {
    const { data, error } = await this.client
      .from('reminders')
      .select('*')
      .eq('chat_id', chatId)
      .eq('delivered', false);

    if (error) {
      throw new Error(`Failed to fetch reminders: ${error.message}`);
    }

    return data;
  }

  async deleteReminder(id: string) {
    const { error } = await this.client.from('reminders').delete().eq('id', id);

    if (error) throw new Error(`Failed to delete reminder: ${error.message}`);
  }

  async getDueReminders(): Promise<
    { id: string; chat_id: number; text: string; date: string }[]
  > {
    const date = dayjs().add(7, 'hour'); // текущее время +3ч
    const oneMinuteAgo = date.subtract(1, 'minute'); // минута назад

    const nowUtc = date.utc().toISOString();
    const oneMinuteAgoUtc = oneMinuteAgo.utc().toISOString();
    const { data, error } = await this.client
      .from('reminders')
      .select('*')
      .eq('delivered', false)
      .gte('date', oneMinuteAgoUtc)
      .lte('date', nowUtc);

    if (error) {
      throw new Error(`Failed to fetch due reminders: ${error.message}`);
    }

    return (data ?? []).map((reminder) => ({
      id: reminder.id,
      chat_id: reminder.chat_id,
      text: reminder.text,
      date: reminder.date, // или форматировать если нужно
    }));
  }

  async markAsDelivered(id: string) {
    const { error } = await this.client
      .from('reminders')
      .update({ delivered: true })
      .eq('id', id);

    if (error)
      throw new Error(`Failed to mark reminder as delivered: ${error.message}`);
  }
}
