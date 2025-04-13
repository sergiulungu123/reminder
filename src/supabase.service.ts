import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient;

  constructor() {
    const url = 'https://lrsgsgkissnmromalfsu.supabase.co';
    const key =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxyc2dzZ2tpc3NubXJvbWFsZnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NDExMzEsImV4cCI6MjA2MDExNzEzMX0.OlXZpo0mgZDnKK9iiEyrzF1avMlPdwa3YSuf3H0-YK4';
    this.client = createClient(url, key);
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  async addReminder(chatId: number, date: string, text: string) {
    const { error } = await this.client.from('reminders').insert({
      chat_id: chatId,
      date,
      text,
    });

    if (error) {
      throw new Error(`Failed to add reminder: ${error.message}`);
    }
  }

  async getReminders(chatId: number) {
    const { data, error } = await this.client
      .from('reminders')
      .select('*')
      .eq('chat_id', chatId);

    if (error) {
      throw new Error(`Failed to fetch reminders: ${error.message}`);
    }

    return data;
  }
}
