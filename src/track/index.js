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
	
	const url = `https://api.vk.com/method/audio.get?access_token=${process.env.AUDIO_TOKEN}&owner_id=${params.ownerId}&count=${params.count || ''}&album_id=${params.playlistId || ''}&access_key=${params.accessKey || ''}&v=5.103`;
	const proxiedRequest = rp.defaults({ proxy: 'http://84.201.170.136:8081' });

	const tracks = (await proxiedRequest(url, {
		method: 'POST',
		headers: {
			'User-Agent': `${process.env.USER_AGENT}`,
		},
		json: true,
	})).response.items;

	console.log(tracks.forEach(track => console.log(track.album.thumb)));

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

export async function getPlaylistInfo(link) {
	const queryParams = new URL(link).searchParams;
	const playlist = queryParams.get('act');
	const accessKey = queryParams.get('access_hash');
	const [ownerId, playlistId] = playlist.replace('audio_playlist', '').split('_');
	const url = `https://api.vk.com/method/audio.getPlaylistById?access_token=${process.env.AUDIO_TOKEN}&owner_id=${ownerId}&playlist_id=${playlistId}&access_key=${accessKey}&v=5.103`;
	const proxiedRequest = rp.defaults({ proxy: 'http://84.201.170.136:8081' });

	const response = (await proxiedRequest(url, {
		method: 'POST',
		headers: {
			'User-Agent': `${process.env.USER_AGENT}`,
		},
		json: true,
	})).response;

	console.log(response);
	const name = response.title;
	const photoUrl = response.photo.photo_1200;

	if (!accessKey) {
		return { ownerId, playlistId, title: name, photoUrl };
	}

	const mainArtists = response.main_artists.map(artist => artist.name).join(', ');
	const featuredArtists = response.featured_artists ? response.featured_artists.map(artist => artist.name).join(', ') : '';
	const artist = featuredArtists ? `${mainArtists} feat. ${featuredArtists}` : mainArtists;

	return { ownerId, playlistId, accessKey, title: `${artist} - ${name}`, photoUrl };
}

export async function sendTracks(tracks, telegramId) {
	for (const track of tracks) {
		await sendTrack(track, telegramId);
	}
}

async function sendTrack(track, telegramId) {
	const { url, artist, title } = track;
	const finishedStream = promisify(finished);
	const file = createWriteStream('audio/' + `${artist} - ${title} - ${telegramId}`.replace(/[/\0]/g, ''));
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

export function sendPlaylistInfo(playlist, telegramId) {
	telegramBot.sendPhoto(telegramId, playlist.photoUrl, { caption: playlist.title });
}