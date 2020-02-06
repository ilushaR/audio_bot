require("dotenv").config();
const fs = require("fs");
const md5 = require("md5");
const express = require("express");
const mongoose = require("mongoose");
const rp = require("request-promise");
const bodyParser = require("body-parser");
const VkBot = require("node-vk-bot-api");

const TelegramBot = require("node-telegram-bot-api");
const bot_telegram = new TelegramBot(process.env.TOKEN_TELEGRAM, {polling: true});
console.log(process.env.TOKEN_TELEGRAM);

const app = express();

mongoose.connect(process.env.DATABASE_URL, { useUnifiedTopology: true , useNewUrlParser: true },  err => {
	if (err) throw err;
	console.log("Successfully connected");
});

const songSchema = mongoose.Schema({
	url: String,
	artist: String,
	title: String
});

const userSchema = mongoose.Schema({
	_id: {type: mongoose.Schema.Types.ObjectId, default: mongoose.Types.ObjectId() },
	id_vk: Number,
	id_telegram: { type: Number, default: null },
	name: String,
	surname: String,
	permission: { type: Boolean, default: true },
	songs: { type: [songSchema], default: [null, null, null]}
});

const User = mongoose.model("User", userSchema);
const Song = mongoose.model("Song", songSchema);

const bot_VK = new VkBot({
	token: process.env.TOKEN_VK,
	confirmation: process.env.CONFIRMATION_VK
});

bot_VK.event("message_new", async (ctx) => {
	const id_vk = ctx.message.from_id;
	const user = await User.find({ id_vk });
	const permission = user[0] ? user[0].permission : false; 
	if (!permission) {
		return ctx.reply("Ты не вступил в группу. Вступи в группу и тогда сможешь получать треки");
	}
	if (!ctx.message.attachments[0] || ctx.message.attachments.every(attachment => attachment.type !== "audio")) {
		return ctx.reply("Я не получил трек. Выбери музыку и отправь ее мне");
	}
	let tracks = [];
	ctx.message.attachments.filter(attachment => attachment.type === "audio").map(({ audio }) => {
		const { url, artist, title } = audio;
		const song = new Song({ url, artist, title });
		tracks.push(song);
	});
	
	await User.updateOne({ id_vk, permission: true }, { $set: { songs: tracks }});
	const { id_telegram, songs } = await User.findOne({ id_vk }, {id_telegram: 1, songs: 1});
	if (!id_telegram) {
		ctx.reply("Ты не авторизовался в телеграме. Перейди к боту");
		const hash = md5(id_vk + process.env.SALT).substr(0, 10);
		ctx.reply(`tlgg.ru/WannaMovieBot?start=${id_vk}-${hash}`);
		return;
	}

	ctx.reply("tlgg.ru/WannaMovieBot");

	songs.forEach(async ({url, artist, title}, index) => {
		const file = fs.createWriteStream(`audio${index}.mp3`);
		const stream = rp(url).pipe(file);
		stream.on("finish", () => {

			bot_telegram.sendAudio(id_telegram, file.path, { performer: artist, title });
		});
	});

});



bot_VK.event("group_join", async (ctx) => {
	const id_vk = ctx.message.user_id;
	console.log(ctx.message);
	const user = await User.find({ id_vk });
	console.log(user);
	if (!user[0]) {
		const { first_name: name, last_name: surname } = await rp(`https://api.vk.com/method/users.get?user_ids=${id_vk}&access_token=${process.env.TOKEN_VK}&v=5.101`).then(res => JSON.parse(res).response[0]);
		const new_user = new User({id_vk, name, surname});
		await new_user.save();
	}
	if (!user[0] || !user.id_telegram) {
		const hash = await md5(id_vk + process.env.SALT).substr(0, 10);
		ctx.reply("Привет, авторизуйся в телеграме, чтобы ты смог получать аудиозаписи");
		ctx.reply(`tlgg.ru/WannaMovieBot?start=${id_vk}-${hash}`);
	}
	await User.updateOne({ id_vk }, { $set: { permission: true }});
});

bot_VK.event("group_leave", async ctx => {
	const id_vk = ctx.message.user_id;
	await User.updateOne({ id_vk }, { $set: { permission: false }});
});


bot_telegram.onText(/\/start/, async msg => {
	const id_telegram = msg.chat.id;
	const message = msg.text.slice(7).split("-");
	const [id_vk, hash] = message;
	if (md5(id_vk + process.env.SALT).substr(0, 10) === hash) {
		await User.updateOne({ id_vk }, { $set: { id_telegram }});
		bot_telegram.sendMessage(id_telegram, "Ты добавлен, теперь может отправлять аудио боту в ВК");
	} else {
		bot_telegram.sendMessage(id_telegram, "Нет доступа, либо уже авторизовался");
	}
});

app.use(bodyParser.json());

app.post("/", bot_VK.webhookCallback);

app.listen(process.env.PORT || 5000, () => console.log("Server is working"));
