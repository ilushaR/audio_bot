require('dotenv').config();
const fs = require('fs');
const md5 = require('md5');
const express = require('express');
const mongoose = require('mongoose');
const rp = require('request-promise');
const bodyParser = require('body-parser');
const VkBot = require('node-vk-bot-api');
const Markup = require('node-vk-bot-api/lib/markup');
const TelegramBot = require('node-telegram-bot-api');
const stream = require('stream');
const util = require('util');
const api = require('node-vk-bot-api/lib/api');

const bot_telegram = new TelegramBot(process.env.TOKEN_TELEGRAM, {
	polling: true,
});
const bot_VK = new VkBot({
	token: process.env.TOKEN_VK,
	confirmation: process.env.CONFIRMATION_VK,
});
const app = express();

mongoose.connect(
	process.env.DATABASE_URL,
	{ useUnifiedTopology: true, useNewUrlParser: true },
	err => {
		if (err) throw err;
		console.log('Successfully connected');
	}
);

const songSchema = mongoose.Schema(
	{
		url: String,
		artist: String,
		title: String,
	},
	{ _id: false }
);

const userSchema = mongoose.Schema({
	id_vk: Number,
	id_telegram: Number,
	name: String,
	surname: String,
	permission: Boolean,
	songs: [songSchema],
});

const User = mongoose.model('User', userSchema);
const Song = mongoose.model('Song', songSchema);

function searchForAudios(obj, audio) {
	if (obj.reply_message) {
		const filtered = obj.reply_message.attachments.filter(
			(attachment) => attachment.type === 'audio'
		);
		audio.push(...filtered);
		searchForAudios(obj.reply_message, audio);
	}

	if (obj.fwd_messages) {
		for (let fwd_msg of obj.fwd_messages) {
			const filtered = fwd_msg.attachments.filter(
				attachment => attachment.type === 'audio'
			);
			audio.push(...filtered);
			searchForAudios(fwd_msg, audio);
		}
	}
}

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
}

bot_VK.event('message_new', async (ctx) => {
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

		const { message_id } = await api('messages.send', {
			peer_id: id_vk,
			message: 'tg://resolve?domain=ilushaR_bot',
			access_token: process.env.TOKEN_VK,
		}).catch(console.log);

		console.log(message_id);

		await api('messages.pin', {
			peer_id: id_vk,
			message_id: message_id,
			access_token: process.env.TOKEN_VK,
		}).catch(console.log);

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
});

app.use(bodyParser.json());

app.post('/', bot_VK.webhookCallback);

app.listen(process.env.PORT || 5000, () => console.log('Server is working'));
