import express from 'express';
import User from '../database/models/user';
import { getTracks } from '../track';
import vkBot from '../bots/vk';

const router = express.Router();

router.get('/getUserById', async (req, res) => {
	const vkId = req.query.id;
	const response = {};

	if (!vkId) {
		return res.json(response);
	}
    
	const user = await User.findOne({ vkId });
    
	if (!user) {
		return res.json(response);
	}

	response.permission = user.permission;
	response.telegramId = user.telegramId;

	return res.json(response);
});

router.get('/getTracksById', async (req, res) => {
	const vkId = req.query.id;
	const response = {};

	if (!vkId) {
		return res.json(response);
	}
    
	response.tracks = await getTracks({ owner_id: vkId });
    
	return res.json(response);
});

router.post('/', vkBot.webhookCallback);

export default router;