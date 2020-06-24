const mongoose = require('./index');

const songSchema = mongoose.Schema(
	{
		url: String,
		artist: String,
		title: String,
	},
	{ _id: false }
);

const userSchema = mongoose.Schema({
	id_vk: Number,
	id_telegram: Number,
	name: String,
	surname: String,
	permission: Boolean,
	songs: [songSchema],
});

const User = mongoose.model('User', userSchema);
const Song= mongoose.model('Song', songSchema);

module.exports = {
	User,
	Song
};

