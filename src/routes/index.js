import express from 'express';
import vkBot from '../bots/vk';
import User from '../database/models/user';
import md5 from 'md5';
import { getTracks, sendTracks } from '../track';


const router = express.Router();

router.get('/', (req, res) => {
	res.json({});
})

router.post('/', vkBot.webhookCallback);

router.get('/getUser', async (req, res) => {
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

router.get('/getTracks', async (req, res) => {
	const vkId = req.query.id;
	const response = {};

	if (!vkId) {
		return res.status(400).json(response);
	}
    
	try {
		response.tracks = await getTracks({ owner_id: vkId });
    
		return res.json(response);
	} catch(e) {
		console.log(e);
		return res.status(500).json(response);
	}
});

router.get('/getHash', async (req, res) => {
	const vkId = req.query.id;
	const hash = md5(vkId + process.env.SALT).substr(0, 10);

	res.json({ hash });
});

router.post('/sendTracks', (req, res) => {
	const tracks = req.body;
	const telegramId = req.query.id;
	
	sendTracks(tracks, telegramId);

	res.json({});
});

export default router;
