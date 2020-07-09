import mongoose from './index';

const songSchema = mongoose.Schema(
	{
		url: String,
		artist: String,
		title: String,
	},
	{ _id: false }
);

const userSchema = mongoose.Schema({
	vkId: Number,
	telegramId: Number,
	name: String,
	surname: String,
	permission: Boolean,
	songs: [songSchema],
});

const User = mongoose.model('User', userSchema);
const Song = mongoose.model('Song', songSchema);

export {
	User,
	Song
};

