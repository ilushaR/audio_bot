// import fs from 'fs';
// import rp from 'request-promise';
// import stream from 'stream';
// import util from 'util';
// import { parentPort } from 'worker_threads';

const { parentPort } = require('worker_threads');
const fs = require('fs');
const rp = require('request-promise');
const stream = require('stream');
const util = require('util');
// const WorkerData = require('.');
// import WorkerData from '.';

console.log('hi');

function createFiles(tracks, telegramId) {
	return tracks.map(track => createFile(track, telegramId));
}

function createFile({ url, artist, title }, telegramId) {
	const finishedStream = util.promisify(stream.finished);
	const file = fs.createWriteStream('audio/' + `${artist} - ${title} - ${telegramId}.mp3`.replace(/[/\0]/g, ''));
	const fileStream = rp(url).pipe(file);	

	// console.log(fileStream);

	return fileStream;
}

if (parentPort) {
	parentPort.on('message', ({ tracks, telegramId, index }) => {
		// WorkerData.promises[index] = createFiles(tracks, telegramId);
		// WorkerData.telegramId = telegramId;
		const files = createFiles(tracks, telegramId);
		// console.log(`worker${index} is done`)
		// parentPort.postMessage({ completed: true }, promises);
		parentPort.postMessage({ completed: 2 });
	});
}
