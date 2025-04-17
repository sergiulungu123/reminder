import * as Joi from 'joi';

import appConfig, { appSchema } from './app.config';

export const configArray = [appConfig];

export const environmentSchema = Joi.object({
  ...appSchema,
});
