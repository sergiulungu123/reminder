import * as Joi from 'joi';
import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  botToken: process.env.BOT_TOKEN!,
  supabaseToken: process.env.SUPABASE_TOKEN!,
  supabaseUrl: process.env.SUPABASE_URL!,
}));

export const appSchema = {
  BOT_TOKEN: Joi.string().required(),
  SUPABASE_TOKEN: Joi.string().required(),
  SUPABASE_URL: Joi.string().required(),
};
