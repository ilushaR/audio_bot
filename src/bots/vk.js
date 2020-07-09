import VkBot from 'node-vk-bot-api';
import { keyboard, button } from 'node-vk-bot-api/lib/markup';
import api from 'node-vk-bot-api/lib/api';
import { User, Song } from '../database/schema';
import md5 from 'md5';
import { telegramBot, sendAudios } from './telegram';
import { searchForAudios } from '../utils';


const vkBot = new VkBot({
	token: process.env.TOKEN_VK,
	confirmation: process.env.CONFIRMATION_VK_TEST,
});

vkBot.event('message_new', async ctx => {
	const vkId = ctx.message.from_id;
	console.log(vkId);
	const user = await User.find({ vkId });
	const permission = user[0] ? user[0].permission : false;

	if (!permission) {
		return ctx.reply(
			'Ты не вступил в группу. Вступи в группу и тогда сможешь получать треки'
		);
	}

	const audios = ctx.message.attachments.filter(
		(attachment) => attachment.type === 'audio'
	);

	searchForAudios(ctx.message, audios);

	if (!audios[0]) {
		return ctx.reply('Я не получил трек. Выбери музыку и отправь ее мне');
	}

	const tracks = audios.map(({ audio }) => {
		const { url, artist, title } = audio;
		return new Song({ url, artist, title });
	});

	await User.updateOne(
		{ vkId, permission: true },
		{ $set: { songs: tracks } }
	);

	const { telegramId, songs } = await User.findOne(
		{ vkId },
		{ telegramId: 1, songs: 1 }
	);

	if (!telegramId) {
		const hash = md5(vkId + process.env.SALT).substr(0, 10);
		
		return ctx.reply(
			'Ты не авторизовался в телеграме. Перейди к боту',
			null,
			keyboard([
				[
					button({
						action: {
							type: 'open_link',
							link: `https://t.me/ilushaR_bot?start=${vkId}-${hash}`,
							label: 'Telegram Authorization 🔓',
							payload: JSON.stringify({
								url: `https://t.me/ilushaR_bot?start=${vkId}-${hash}`,
							}),
						},
					}),
				],
			]).oneTime()
		);
	}

	telegramBot.sendMessage(telegramId, 'Держи');
	ctx.reply(
		'Забирай музыку 🎧\n\ntg://resolve?domain=ilushaR_bot',
		null,
		keyboard([
			[
				button({
					action: {
						type: 'open_link',
						link: 'https://t.me/ilushaR_bot',
						label: 'Telegram ✈️',
						payload: JSON.stringify({
							url: 'https://t.me/ilushaR_bot',
						}),
					},
				}),
			],
		]).oneTime()
	);

	sendAudios(songs, telegramId);
});

vkBot.event('group_join', async (ctx) => {
	const vkId = ctx.message.user_id;
	const user = await User.find({ vkId });

	if (!user[0]) {
		const { first_name: name, last_name: surname } = (await api('users.get', {
			user_ids: vkId,
			access_token: process.env.TOKEN_VK,
		})).response[0];

		const newUser = new User({
			vkId,
			telegramId: null,
			name,
			surname,
			permission: true,
			songs: [null, null, null],
		});
		const hash = md5(vkId + process.env.SALT).substr(0, 10);

		ctx.reply('Привет, авторизуйся в телеграме, чтобы ты смог получать аудиозаписи',
			null,
			keyboard([
				[
					button({
						action: {
							type: 'open_link',
							link: `https://t.me/ilushaR_bot?start=${vkId}-${hash}`,
							label: 'Telegram Authorization 🔓',
							payload: JSON.stringify({
								url: `https://t.me/ilushaR_bot?start=${vkId}-${hash}`,
							}),
						},
					}),
				],
			]).oneTime()
		);
		await newUser.save();
	}
	await User.updateOne({ vkId }, { $set: { permission: true } });
});

vkBot.event('group_leave', async (ctx) => {
	const vkId = ctx.message.user_id;
	await User.updateOne({ vkId }, { $set: { permission: false } });
});

export default vkBot;