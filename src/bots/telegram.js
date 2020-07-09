import TelegramBot from 'node-telegram-bot-api';
import { User } from '../database/schema';
import md5 from 'md5';
import { createWriteStream } from 'fs';
import { finished } from 'stream';
import { promisify } from 'util';
import rp from 'request-promise';
import { asyncForEach } from '../utils';

function sendAudios(songs, telegramId) {
	const finishedStream = promisify(finished);

	asyncForEach(songs, async ({ url, artist, title }, index) => {
		const file = createWriteStream(`audio${index}.mp3`);
		const stream = rp(url).pipe(file);
		await finishedStream(stream);
        
		telegramBot.sendAudio(telegramId, file.path, {
			performer: artist,
			title,
		});
	});
}

const telegramBot = new TelegramBot(process.env.TOKEN_TELEGRAM, {
	polling: true,
});

telegramBot.onText(/\/start/, async (msg) => {
	const telegramId = msg.chat.id;
	const message = msg.text.slice(7).split('-');
	const [vkId, hash] = message;
	const user = await User.find({ telegramId });

	if (user[0]) {
		return telegramBot.sendMessage(telegramId, 'Ты уже добавлен');
	}

	if (md5(vkId + process.env.SALT).substr(0, 10) !== hash) {
		return telegramBot.sendMessage(telegramId, 'Нет доступа');
	}

	await User.updateOne({ vkId }, { $set: { telegramId } });
	telegramBot.sendMessage(
		telegramId,
		'Ты добавлен, теперь можешь получать музыку'
	);
	const { songs } = await User.findOne({ vkId }, { songs: 1 });

	if (songs[0]) {
		sendAudios(songs, telegramId);
	}
});

export default {
	telegramBot,
	sendAudios
};