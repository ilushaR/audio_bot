import mongoose from '..';

const userSchema = mongoose.Schema({
	vkId: Number,
	telegramId: Number,
	name: String,
	surname: String,
	permission: Boolean,
});

const User = mongoose.model('User', userSchema);

export default User;