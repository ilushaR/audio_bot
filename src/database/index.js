const mongoose = require('mongoose');

mongoose.connect(
	process.env.DATABASE_URL,
	{ useUnifiedTopology: true, useNewUrlParser: true },
	err => {
		if (err) throw err;
		console.log('Successfully connected');
	}
);

module.exports = mongoose;