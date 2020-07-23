import api from 'node-vk-bot-api/lib/api';
import { keyboard, button } from 'node-vk-bot-api/lib/markup';
import text from '../text';



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
					button(text.buttons.downloadTracks, 'primary')
				],
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
	selectTracks: function(ctx) {
		const buttons = [
			[ button(text.buttons.select) ], 
			[ button(text.buttons.downloadAll) ]		
		];

		ctx.reply(
			'Твои аудиозаписи',
			null,
			keyboard(buttons).inline(),
		);
	}, 
	showTracks: function(ctx, payload) {

		const { tracks, name, index, telegramId } = payload;
		// for (let i = 0; i < 5; i++) {
		// 	const label = `${payload.tracks[i].artist} - ${payload.tracks[i].title}`;
		// 	const formatLabel = label.length > 40 ? label.slice(0, 37) + '...' : label;
		// 	elements[i] = {
		// 		[button(formatLabel)]
		// 	};
		// }
		
		const start = index * 10;
		const currentTracks = tracks.slice(start, start + 10);

		const elements = currentTracks.map(track => ({
			title: track.title,
			description: track.artist,
			// photo_id: '-109837093_457242811',
			// photo_id: '-184374271_457239031',
			photo_id: '-184374271_457239032',
			buttons: [
				button('EZ'), 
				// button({
				// 	action: {
				// 		type: 'callback',
				// 		label: text.buttons.next,
				// 		payload: JSON.stringify({ name, telegramId, index: index + 1 }),
				// 	},
				// })
			],
			// action: {
			// 	type: 'open_photo',
			// },
		}));




		// if (start !== 0) {
		// elements[0].buttons = [button({
		// 	action: {
		// 		type: 'callback',
		// 		label: text.buttons.previous,
		// 		payload: JSON.stringify({ name, telegramId, index: index - 1 }),
		// 	},
		// }) ];
		// }


		// elements[elements.length - 1].buttons.unshift(button({
		// 	action: {
		// 		type: 'callback',
		// 		label: text.buttons.next,
		// 		payload: JSON.stringify({ name, telegramId, index: index + 1 }),
		// 	},
		// }));

		// console.log(elements);
		// buttons.push([
		// 	button({
		// 		action: {
		// 			type: 'callback',
		// 			label: text.buttons.downloadAll,
		// 			payload: JSON.stringify({ name: payload.name, telegramId: payload.telegramId }),
		// 		},
		// 	})
		// ]);

		const template = {
			type: 'carousel',
			elements
		};


		console.log(JSON.stringify(template));

		api('messages.send', {
			// user_id: ctx.message.from_id,
			peer_id: ctx.message.from_id,
			message: 'Выбери аудиозапись',
			random_id: Date.now(),
			template: JSON.stringify(template),
			// template: template,
			access_token: process.env.VK_TOKEN,
		});


		// ctx.reply(
		// 	'Твои Аудиозаписи',
		// 	null,
		// 	keyboard(buttons).inline(),
		// );
	},
};

export default response;