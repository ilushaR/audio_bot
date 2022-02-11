import VkBot from 'node-vk-bot-api';
import api from 'node-vk-bot-api/lib/api';
import User from '../database/models/user';
import md5 from 'md5';
import telegramBot from './telegram';
import { getTracks, getPlaylistInfo, searchForTracks, sendTracks, sendPlaylistInfo } from '../track';
import response from '../response/vk';
import text from '../text';


const vkBot = new VkBot({
	token: process.env.VK_TOKEN,
	confirmation: process.env.VK_CONFIRMATION,
});

vkBot.event('message_new', async ctx => {
	const vkId = ctx.message.from_id;
	const user = await User.findOne({ vkId });
	const permission = user ? user.permission : false;

	if (!permission) {
		return response.vkNotAuth(ctx);
	}

	const { telegramId } = user;

	try {
		if (!telegramId) {
			const hash = md5(vkId + process.env.SALT).substr(0, 10);
			
			return response.telegramAuth(ctx, vkId, hash);
		}

		// if (ctx.message.text === text.buttons.downloadAll) {
		// 	const tracks = await getTracks({ owner_id: vkId });
		
		// 	sendTracks(tracks, telegramId);
	
		// 	return response.receiveTrack(ctx, user.name);
		// }

		// if (ctx.message.text === text.buttons.select) {
		// 	const tracks = await getTracks({ owner_id: vkId });
			
		// 	return response.selectTracks(ctx, { name: user.name, telegramId, tracks });
		// }

		const tracks = ctx.message.attachments.filter(
			(attachment) => attachment.type === 'audio'
		);
    
		searchForTracks(ctx.message, tracks);

		if (!ctx.message.attachments[0] && tracks.length === 0) {
			return response.help(ctx);
		}

		if (ctx.message.attachments[0] && ctx.message.attachments[0].type === 'link') {
			const { ownerId, playlistId, accessKey, title, photoUrl } = await getPlaylistInfo(ctx.message.attachments[0].link.url);

			await sendPlaylistInfo({ title, photoUrl }, telegramId);

			const tracks = await getTracks({ owner_id: ownerId, playlist_id: playlistId, access_key: accessKey });
		
			await sendTracks(tracks, telegramId);

			return response.receiveTrack(ctx, user.name);
		}
			
		const audios = tracks.map(({ audio }) => {
			const { url, artist, title } = audio;
			return { url, artist, title };
		});
	
		await sendTracks(audios, telegramId);
	
		response.receiveTrack(ctx, user.name);
	} catch(e) {
		console.log(e);
		response.errorHandler(ctx, user.name);
	}
});


vkBot.event('message_event', async ctx => {
	const { name, telegramId } = ctx.message.payload;
	const vkId = ctx.message.user_id;

	const tracks = await getTracks({ owner_id: vkId });
	
	sendTracks(tracks, telegramId);

	response.receiveTrack(ctx, name);
});

vkBot.event('group_join', async (ctx) => {
	const vkId = ctx.message.user_id;
	const user = await User.findOne({ vkId });

	if (!user) {
		const { first_name: name, last_name: surname } = (await api('users.get', {
			user_ids: vkId,
			access_token: process.env.VK_TOKEN,
		})).response[0];

		const newUser = new User({
			vkId,
			telegramId: null,
			name,
			surname,
			permission: true,
		});
		const hash = md5(vkId + process.env.SALT).substr(0, 10);

		response.groupJoin(ctx, vkId, hash);

		await newUser.save();
	}
	await User.updateOne({ vkId }, { $set: { permission: true } });
});

vkBot.event('group_leave', async (ctx) => {
	const vkId = ctx.message.user_id;
	await User.updateOne({ vkId }, { $set: { permission: false } });
});

export default vkBot;