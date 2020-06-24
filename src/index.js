require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const bot_VK = require('./bots/vk');
// eslint-disable-next-line no-unused-vars
const bot_telegram = require('./bots/telegram');
// eslint-disable-next-line no-unused-vars
const mongoose = require('./database/index');


const app = express();




app.use(bodyParser.json());

app.post('/', bot_VK.webhookCallback);

app.listen(process.env.PORT || 5000, () => console.log('Server is working'));
