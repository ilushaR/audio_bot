import mongoose from 'mongoose';

mongoose.connect(
	process.env.DATABASE_URL,
	{ useUnifiedTopology: true, useNewUrlParser: true },
	err => {
		if (err) throw err;
		console.log('Successfully connected');
	}
);

export default mongoose;