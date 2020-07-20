import telegramBot from '../bots/telegram';
import rp from 'request-promise';
import { createWriteStream, unlink } from 'fs';
import { finished } from 'stream';
import { promisify } from 'util';


export async function getTracks(params) {
	function convertFormat(url) {
		if (/\.m3u8\?/.test(url)) {
			url = url.replace('/index.m3u8', '.mp3').split('/');
			const deleteIndex = -1 !== url.indexOf('audios') ? 1 : 0;
			url.splice(url.length - (2 + deleteIndex), 1);
			url = url.join('/');
		}

		return url;
	}
	
	const paramsQuery = Object.entries(params).map(([param, value]) => `${param}=${value}`).join('&');

	const url = `https://api.vk.com/method/audio.get?access_token=${process.env.TOKEN_AUDIO}&${paramsQuery}&v=5.103`;

	const tracks = (await rp(url, {
		method: 'POST',
		headers: {
			'User-Agent': `${process.env.USER_AGENT}`,
		},
		json: true,
	})).response.items;

	return tracks.filter(({ url }) => url).map(({ artist, title, url }) => ({ artist, title, url: convertFormat(url) }));
}

export function searchForTracks(obj, tracks) {
	if (obj.reply_message) {
		const filtered = obj.reply_message.attachments.filter(
			(attachment) => attachment.type === 'audio'
		);
		tracks.push(...filtered);
		searchForTracks(obj.reply_message, tracks);
	}

	if (obj.fwd_messages) {
		for (let fwd_msg of obj.fwd_messages) {
			const filtered = fwd_msg.attachments.filter(
				attachment => attachment.type === 'audio'
			);
			tracks.push(...filtered);
			searchForTracks(fwd_msg, tracks);
		}
	}
}

export function getPlaylistInfo(link) {
	const queryParams = new URL(link).searchParams;
	const playlist = queryParams.get('act');
	const accessKey = queryParams.get('access_hash');
	const [ownerId, playlistId] = playlist.replace('audio_playlist', '').split('_');
	
	return { ownerId, playlistId, accessKey };
}

export async function sendTracks(tracks, telegramId) {
	for (const track of tracks) {
		await sendTrack(track, telegramId);
	}
}

async function sendTrack({ url, artist, title }, telegramId){
	const finishedStream = promisify(finished);
	const file = createWriteStream(`${artist} - ${title} - ${telegramId}`.replace(/[/\0]/g, ''));
	const stream = rp(url).pipe(file);

	await finishedStream(stream);
	
	telegramBot.sendAudio(telegramId, file.path, {
		performer: artist,
		title,
	});

	unlink(file.path, err => {
		if (err) throw err;
	}); 
}