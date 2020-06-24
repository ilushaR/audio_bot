const TelegramBot = require('node-telegram-bot-api');
const { User } = require('../database/schema');
const md5 = require('md5');
const fs = require('fs');
const stream = require('stream');
const util = require('util');
const rp = require('request-promise');
const { asyncForEach } = require('../utils');

function sendAudios(songs, id_telegram) {
	const finished = util.promisify(stream.finished);

	asyncForEach(songs, async ({ url, artist, title }, index) => {
		const file = fs.createWriteStream(`audio${index}.mp3`);
		const stream = rp(url).pipe(file);
		await finished(stream);
        
		bot_telegram.sendAudio(id_telegram, file.path, {
			performer: artist,
			title,
		});
	});
}

const bot_telegram = new TelegramBot(process.env.TOKEN_TELEGRAM_TEST, {
	polling: true,
});

bot_telegram.onText(/\/start/, async (msg) => {
	const id_telegram = msg.chat.id;
	const message = msg.text.slice(7).split('-');
	const [id_vk, hash] = message;
	const user = await User.find({ id_telegram });

	if (user[0]) {
		return bot_telegram.sendMessage(id_telegram, 'Ты уже добавлен');
	}

	if (md5(id_vk + process.env.SALT).substr(0, 10) !== hash) {
		return bot_telegram.sendMessage(id_telegram, 'Нет доступа');
	}

	await User.updateOne({ id_vk }, { $set: { id_telegram } });
	bot_telegram.sendMessage(
		id_telegram,
		'Ты добавлен, теперь можешь получать музыку'
	);
	const { songs } = await User.findOne({ id_vk }, { songs: 1 });

	if (songs[0]) {
		sendAudios(songs, id_telegram);
	}
});

module.exports =  {
	bot_telegram,
	sendAudios
};