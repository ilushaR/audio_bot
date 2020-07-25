import 'dotenv/config';
import express from 'express';
import { json } from 'body-parser';
import vkBot from './bots/vk';
import './bots/telegram';
import './database/index';
import User from './database/models/user';

const app = express();

app.use(json());

app.post('/', vkBot.webhookCallback);

app.get('/getUserById', async (req, res) => {
	const vkId = req.query.id;
	const response = {};

	if (!vkId) {
		return res.json(response);
	}
    
	const user = await User.findOne({ vkId });
    
	if (!user) {
		return res.json(response);
	}

	response.telegramId = user.telegramId;

	return res.json(response);
});

app.listen(process.env.PORT || 8080, () => console.log('Server is working'));
