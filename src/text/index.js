const text = {
	buttons: {
		downloadAll: 'Скачать все',
		select: 'Можешь выбрать из своих аудиозаписей',
		telegram: 'Telegram ✈️',
		telegramAuth: 'Telegram Authorization 🔓',
	},
	messages: {
		groupJoin: name => `Привет ${name}, авторизуйся в телеграме, чтобы ты смог получать аудиозаписи`,
		help: 'Выбери музыку и отправь мне',
		haveAccess: 'Ты уже добавлен',
		notAccess: 'Нет доступа',
		telegramJoin: 'Ты добавлен, теперь можешь получать музыку',
		telegramNotAuth: 'Ты не авторизовался в телеграме. Перейди к боту',
		telegramReceive: 'Держи',
		vkNotAuth: 'Ты не вступил в группу. Вступи в группу и тогда сможешь получать треки',
		vkReceive: name => `${name}, забирай музыку 🎧`,
	}, 
	links: {
		telegramWeb: 'https://t.me/ilushaR_bot',
		telegramApp: 'tg://resolve?domain=ilushaR_bot',
	},
};

export default text;



