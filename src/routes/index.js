import express from 'express';
import User from '../database/models/user';
import { getTracks, sendTracks } from '../track';
import vkBot from '../bots/vk';

const router = express.Router();

router.post('/', vkBot.webhookCallback);

router.get('/getUserById', async (req, res) => {
	const vkId = req.query.id;
	const response = {};

	if (!vkId) {
		return res.status(400).json(response);
	}
    
	const user = await User.findOne({ vkId });
    
	if (!user) {
		return res.status(401).json(response);
	}

	response.permission = user.permission;
	response.telegramId = user.telegramId;

	return res.json(response);
});

router.get('/getTracksById', async (req, res) => {
	const vkId = req.query.id;
	const response = {};

	if (!vkId) {
		return res.status(400).json(response);
	}
    
	try {
		response.tracks = await getTracks({ owner_id: vkId });
    
		return res.json(response);
	} catch(e) {
		return res.status(500).json(response);
	}
});

router.post('/sendTracks', (req, res) => {
	const tracks = req.body;
	const telegramId = req.query.id;
	
	sendTracks(tracks, telegramId);

	res.json({});
});

export default router;