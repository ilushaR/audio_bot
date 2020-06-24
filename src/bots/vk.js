const VkBot = require('node-vk-bot-api');
const Markup = require('node-vk-bot-api/lib/markup');
const api = require('node-vk-bot-api/lib/api');
const { User, Song } = require('../database/schema');
const md5 = require('md5');
const { bot_telegram, sendAudios } = require('./telegram');
const { searchForAudios } = require('../utils');


const bot_VK = new VkBot({
	token: process.env.TOKEN_VK,
	confirmation: process.env.CONFIRMATION_VK,
});

bot_VK.event('message_new', async ctx => {
	const id_vk = ctx.message.from_id;
	const user = await User.find({ id_vk });
	const permission = user[0] ? user[0].permission : false;

	if (!permission) {
		return ctx.reply(
			'Ты не вступил в группу. Вступи в группу и тогда сможешь получать треки'
		);
	}

	let audios = ctx.message.attachments.filter(
		(attachment) => attachment.type === 'audio'
	);

	searchForAudios(ctx.message, audios);

	if (!audios[0]) {
		return ctx.reply('Я не получил трек. Выбери музыку и отправь ее мне');
	}

	let tracks = [];
	audios.forEach(({ audio }) => {
		const { url, artist, title } = audio;
		const song = new Song({ url, artist, title });
		tracks.push(song);
	});

	await User.updateOne(
		{ id_vk, permission: true },
		{ $set: { songs: tracks } }
	);
	const { id_telegram, songs } = await User.findOne(
		{ id_vk },
		{ id_telegram: 1, songs: 1 }
	);

	if (!id_telegram) {
		const hash = md5(id_vk + process.env.SALT).substr(0, 10);
		return ctx.reply(
			'Ты не авторизовался в телеграме. Перейди к боту',
			null,
			Markup.keyboard([
				[
					Markup.button({
						action: {
							type: 'open_link',
							link: `https://t.me/ilushaR_bot?start=${id_vk}-${hash}`,
							label: 'Telegram Authorization 🔓',
							payload: JSON.stringify({
								url: `https://t.me/ilushaR_bot?start=${id_vk}-${hash}`,
							}),
						},
					}),
				],
			]).oneTime()
		);
	}

	bot_telegram.sendMessage(id_telegram, 'Держи');
	ctx.reply(
		'Забирай музыку 🎧\n\ntg://resolve?domain=ilushaR_bot',
		null,
		Markup.keyboard([
			[
				Markup.button({
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

	sendAudios(songs, id_telegram);
});

bot_VK.event('group_join', async (ctx) => {
	const id_vk = ctx.message.user_id;
	const user = await User.find({ id_vk });

	if (!user[0]) {
		const { first_name: name, last_name: surname } = await api('users.get', {
			user_ids: id_vk,
			access_token: process.env.TOKEN_VK,
		}).then(res => res.response[0]);

		const new_user = new User({
			id_vk,
			id_telegram: null,
			name,
			surname,
			permission: true,
			songs: [null, null, null],
		});
		const hash = md5(id_vk + process.env.SALT).substr(0, 10);

		ctx.reply('Привет, авторизуйся в телеграме, чтобы ты смог получать аудиозаписи',
			null,
			Markup.keyboard([
				[
					Markup.button({
						action: {
							type: 'open_link',
							link: `https://t.me/ilushaR_bot?start=${id_vk}-${hash}`,
							label: 'Telegram Authorization 🔓',
							payload: JSON.stringify({
								url: `https://t.me/ilushaR_bot?start=${id_vk}-${hash}`,
							}),
						},
					}),
				],
			]).oneTime()
		);
		await new_user.save();
	}
	await User.updateOne({ id_vk }, { $set: { permission: true } });
});

bot_VK.event('group_leave', async (ctx) => {
	const id_vk = ctx.message.user_id;
	await User.updateOne({ id_vk }, { $set: { permission: false } });
});

module.exports = bot_VK;