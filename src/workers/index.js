import os from 'os';
import { Worker } from 'worker_threads';
import { sendTrack } from '../track'; 

class WorkersData {

	constructor() {
		this.workers = [];
		// const numberOfThreads = os.cpus().length;
		const numberOfThreads = 1;
		this.completed = 0;
		this.tracks = [];
		this.promises = [];
	
		for (let i = 0; i < numberOfThreads; i++) {
			const worker = new Worker('./src/workers/worker.js');		
			console.log(`worker ${i + 1}`);


			worker.on('message', async (message) => {
				console.log(message);
				if (message.completed) {
					this.completed++;
					this.telegramId = message.telegramId;
				}
				if (this.completed === numberOfThreads) {
					console.log('all workers do their jobs!');


					// for (let i = 0; i < this.tracks.length; i++) {
					// 	sendTrack()
					// 	// sendTrack(this.tracks[i], this.telegramId);
					// }

					console.log('workers send tracks');

					this.completed = 0;
					this.promises = [];
				}
			});
			
			this.workers.push(worker);
		}
	}

	setTracks(tracks) {
		this.tracks = tracks;
	}

	getWorkers() {
		return this.workers;
	}
	
}

const workers = new WorkersData();

export default workers;