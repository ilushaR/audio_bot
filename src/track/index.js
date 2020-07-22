import telegramBot from '../bots/telegram';
import rp from 'request-promise';
import { unlink } from 'fs';
import WorkersData from '../workers';
import fs from 'fs';


// const telegramBot = require('../bots/telegram');
// const rp = require('request-promise');
// const { unlink } = require('fs');
// const WorkersData = require('../workers');



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

export async function getPlaylistInfo(link) {
	const queryParams = new URL(link).searchParams;
	const playlist = queryParams.get('act');
	const accessKey = queryParams.get('access_hash');
	const [ownerId, playlistId] = playlist.replace('audio_playlist', '').split('_');
	const url = `https://api.vk.com/method/audio.getPlaylistById?access_token=${process.env.AUDIO_TOKEN}&owner_id=${ownerId}&playlist_id=${playlistId}&access_key=${accessKey}&v=5.103`;

	const response = (await rp(url, {
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
	WorkersData.setTracks(tracks);

	const workers = WorkersData.getWorkers();
	const tracksPerThread = Math.ceil(tracks.length / workers.length);

	for (let i = 0; i < workers.length; i++) {
		const start = i * tracksPerThread;
		const end = start + tracksPerThread;
	
		const chunkTracks = tracks.slice(start, end) || [];

		workers[i].postMessage({ tracks: chunkTracks, telegramId });
		for (const track of chunkTracks) {
			sendTrack(track, telegramId);
		}
	}
}

export function sendTrack({ artist, title }, telegramId){
	const filepath = 'audio/' + `${artist} - ${title} - ${telegramId}.mp3`.replace(/[/\0]/g, '');
	fs.access(filepath, fs.constants.F_OK, (err) => {
		console.log(`${filepath} ${err ? 'does not exist' : 'exists'}`);
		if (!err) {
			console.log(filepath);
			telegramBot.sendAudio(telegramId, 'audio/Mnogoznaal - Дуга - 659504599.mp3', {
				performer: artist,
				title,
			});
		}
	});

	unlink(filepath, err => {
		if (err) console.log(err);
	}); 
}

export function sendPlaylistInfo(playlist, telegramId) {
	telegramBot.sendPhoto(telegramId, playlist.photoUrl, { caption: playlist.title });
}
