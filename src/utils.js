function searchForAudios(obj, audio) {
	if (obj.reply_message) {
		const filtered = obj.reply_message.attachments.filter(
			(attachment) => attachment.type === 'audio'
		);
		audio.push(...filtered);
		searchForAudios(obj.reply_message, audio);
	}

	if (obj.fwd_messages) {
		for (let fwd_msg of obj.fwd_messages) {
			const filtered = fwd_msg.attachments.filter(
				attachment => attachment.type === 'audio'
			);
			audio.push(...filtered);
			searchForAudios(fwd_msg, audio);
		}
	}
}

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
}

module.exports = {
	searchForAudios,
	asyncForEach
};