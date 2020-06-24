const fs = require('fs');
const stream = require('stream');
const util = require('util');
const rp = require('request-promise');
const bot_telegram = require('./bots/telegram');

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

function sendAudios(songs, id_telegram) {
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

module.exports = {
	searchForAudios,
	asyncForEach,
	sendAudios
};