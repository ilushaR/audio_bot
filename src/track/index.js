import telegramBot from '../bots/telegram';
import rp from 'request-promise';
import {
	createWriteStream,
	promises
} from 'fs';
import { finished } from 'stream';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import text from '../text';


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
	const url = `https://api.vk.com/method/audio.get?access_token=${process.env.AUDIO_TOKEN}&${paramsQuery}&v=5.120`;

	const response = (await rp(url, {
		method: 'POST',
		headers: {
			'User-Agent': `${process.env.USER_AGENT}`,
		},
		json: true,
	})).response;
	console.log('audio.get', response);


	return response.items.filter(({ url }) => url).map(({ artist, title, url, album, id }) => ({ artist, title, url: convertFormat(url), album, id }));
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

export async function getPlaylistInfo(link) {
	const queryParams = new URL(link).searchParams;
	const playlist = queryParams.get('act');
	const accessKey = queryParams.get('access_hash');
	const [ownerId, playlistId] = playlist.replace('audio_playlist', '').split('_');
	const url = `https://api.vk.com/method/audio.getPlaylistById?access_token=${process.env.AUDIO_TOKEN}&owner_id=${ownerId}&playlist_id=${playlistId}&access_key=${accessKey}&v=5.120`;

	const response = (await rp(url, {
		method: 'POST',
		headers: {
			'User-Agent': `${process.env.USER_AGENT}`,
		},
		json: true,
	})).response;

	console.log('audio.getPlaylistById', response);
	const name = response.title;
	const photoUrl = response.photo ? response.photo.photo_1200 : text.links.playlistPhoto;

	if (!accessKey) {
		return { ownerId, playlistId, title: name, photoUrl };
	}

	const mainArtists = response.main_artists.map(artist => artist.name).join(', ');
	const featuredArtists = response.featured_artists ? response.featured_artists.map(artist => artist.name).join(', ') : '';
	const artist = featuredArtists ? `${mainArtists} feat. ${featuredArtists}` : mainArtists;

	return { ownerId, playlistId, accessKey, title: `${artist} - ${name}`, photoUrl };
}

export async function getAudiosInfo(tracks) {
	const audios = tracks.map(({ audio }) => audio.release_audio_id || `${audio.owner_id}_${audio.id}`);

	const url = `https://api.vk.com/method/audio.getById?access_token=${process.env.AUDIO_TOKEN}&audios=${audios.join(',')}&v=5.120`;

	const response = (await rp(url, {
		method: 'POST',
		headers: {
			'User-Agent': `${process.env.USER_AGENT}`,
		},
		json: true,
	})).response;

	console.log('audio.getById', response);

	if (audios.length !== response.length) {
		console.error('Audios length mismatch', audios, response);
		throw new Error('Audios length mismatch');
	}

	return response.map(a => ({
		url: a.url,
		artist: a.artist,
		title: a.title,
	}));
}

export async function sendTracks(tracks, telegramId) {
	for (const track of tracks) {
		await sendTrack(track, telegramId);
	}
}

async function sendTrack(track, telegramId) {
	const { url, artist, title } = track;
	console.log('Track:', track);

	const filepath = `audio/${uuidv4()}-${Date.now()}.mp3`;

	try {
		const finishedStream = promisify(finished);
		const file = createWriteStream(filepath);
		const stream = rp(url).pipe(file);
		await finishedStream(stream);

		await telegramBot.sendAudio(telegramId, filepath, {
			performer: artist,
			title,
		});
	} catch (e) {
		console.error(e);

		await telegramBot.sendMessage(telegramId, text.messages.sendTrackError({ artist, title }));
	}

	await promises.unlink(filepath).catch(console.error);
}

export function sendPlaylistInfo(playlist, telegramId) {
	return telegramBot.sendPhoto(telegramId, playlist.photoUrl, { caption: playlist.title });
}
