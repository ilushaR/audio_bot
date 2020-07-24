import text from '../text';
import { keyboard, button } from 'node-vk-bot-api/lib/markup';


const response = {
	vkNotAuth: function(ctx) {
		ctx.reply(
			text.messages.vkNotAuth
		);
	},
	telegramAuth: function(ctx, vkId, hash) {
		ctx.reply(
			text.messages.telegramNotAuth,
			null,
			keyboard([
				[
					button({
						action: {
							type: 'open_link',
							link: `${text.links.telegramWeb}?start=${vkId}-${hash}`,
							label: 'Authorization Telegram 🔓',
							payload: JSON.stringify({
								url: `${text.links.telegramWeb}?start=${vkId}-${hash}`,
							}),
						},
					}),
				],
			]).oneTime()
		);
	},
	receiveTrack: function(ctx, username) {
		ctx.reply(
			text.messages.vkReceive(username) + '\n' + text.links.telegramApp,
			null,
			keyboard([
				[
					button(text.buttons.select, 'primary')],
				[
					button({
						action: {
							type: 'open_link',
							link: text.links.telegramWeb,
							label: 'Telegram ✈️',
							payload: JSON.stringify({
								url: text.links.telegramWeb
							}),
						},
					}),
				],
			])
		);
	},
	help: function(ctx) {
		ctx.reply(text.messages.help);
	},
	groupJoin: function(ctx, vkId, hash) {
		ctx.reply(text.messages.groupJoin,
			null,
			keyboard([
				[
					button({
						action: {
							type: 'open_link',
							link: `${text.links.telegramWeb}?start=${vkId}-${hash}`,
							label: text.buttons.telegramAuth,
							payload: JSON.stringify({
								url: `${text.links.telegramWeb}?start=${vkId}-${hash}`,
							}),
						},
					}),
				],
			]).oneTime()
		);
	}, 
	selectTracks: function(ctx, payload) {
		ctx.reply(
			'Свои аудиозаписи',
			null,
			keyboard([
				button({
					action: {
						type: 'callback',
						label: text.buttons.downloadAll,
						payload: JSON.stringify({ name: payload.name, telegramId: payload.telegramId }),
					},
				})
			]).inline(),
		);
	},
	errorHandler: function(ctx) {
		ctx.reply(text.messages.error);
	},
};

export default response;