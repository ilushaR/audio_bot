const text = {
	buttons: {
		download: 'Скачать',
		downloadAll: 'Скачать все',
		downloadTracks: 'Скачать свои аудиозаписи',
		next: '➡️',
		previous: '⬅️',
		select: 'Выбрать аудиозапись',
		telegram: 'Telegram ✈️',
		telegramAuth: 'Telegram Authorization 🔓',
		vk: 'Audio Bot 🎶'
	},
	messages: {
		groupJoin: name => `Привет ${name}, авторизуйся в телеграме, чтобы ты смог получать аудиозаписи`,
		help: 'Выбери музыку и отправь мне',
		haveAccess: 'Ты уже добавлен',
		notAccess: 'Нет доступа',
		sendTracks: 'Отправляй сюда треки',
		telegramJoin: 'Ты добавлен, теперь можешь получать музыку',
		telegramNotAuth: 'Ты не авторизовался в телеграме. Перейди к боту',
		telegramReceive: 'Держи',
		vkNotAuth: 'Ты не вступил в группу. Вступи в группу и тогда сможешь получать треки',
		vkReceive: name => `${name}, забирай музыку 🎧`,
	}, 
	links: {
		telegramWeb: 'https://t.me/ilushaR_bot',
		telegramApp: 'tg://resolve?domain=ilushaR_bot',
		vk: 'https://vk.com/vk_audio_bot',
		vkMessage: 'https://vk.com/im?sel=-184374271'
	},
};

export default text;



