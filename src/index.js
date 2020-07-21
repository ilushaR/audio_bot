import 'dotenv/config';
import express from 'express';
import { json } from 'body-parser';
import vkBot from './bots/vk';
import './bots/telegram';
import './database/index';

const app = express();

app.use(json());

app.post('/', vkBot.webhookCallback);

app.listen(process.env.PORT || 8080, () => console.log('Server is working'));
