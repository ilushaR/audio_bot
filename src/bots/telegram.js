import TelegramBot from 'node-telegram-bot-api';
import User from '../database/models/user';
import md5 from 'md5';
import text from '../text';

const telegramBot = new TelegramBot(process.env.TOKEN_TELEGRAM_TEST, {
	polling: true,
});

telegramBot.onText(/\/start/, async (msg) => {
	const telegramId = msg.chat.id;
	const message = msg.text.slice(7).split('-');
	const [vkId, hash] = message;
	const user = await User.find({ telegramId });

	if (user[0]) {
		return telegramBot.sendMessage(telegramId, text.messages.haveAccess);
	}

	if (md5(vkId + process.env.SALT).substr(0, 10) !== hash) {
		return telegramBot.sendMessage(telegramId, text.messages.notAccess);
	}

	await User.updateOne({ vkId }, { $set: { telegramId } });
	telegramBot.sendMessage(
		telegramId,
		text.messages.telegramJoin
	);
});

telegramBot.onText(/\/vk/, async msg => {
	const telegramId = msg.chat.id;

	telegramBot.sendMessage(
		telegramId,
		text.messages.sendTracks,
		{
			reply_markup: JSON.stringify({
				inline_keyboard: [
					[{ text: text.buttons.vk, url: text.links.vkMessage }],
				]
			}),
		}
	);
});

export default telegramBot;
