import { methods, Route, type ApiRequest, type ApiResponse } from '@sapphire/plugin-api';
import { GetAllTournamentsFromGuild, GetRandomTournament } from '../helper-functions/index.js';

export class UserRoute extends Route {
	public constructor(context: Route.LoaderContext, options: Route.Options) {
		super(context, {
			...options,
			route: 'tournaments'
		});
	}

	public async [methods.GET](_request: ApiRequest, response: ApiResponse) {
		const tournament = await GetRandomTournament();
		if (tournament) {
			const organizer = await this.container.client.users.fetch(tournament.organized_by)
			let winner = null

			if (tournament.winner_id) {
				const user = await this.container.client.users.fetch(tournament.winner_id).catch(() => null)
				if (user) {
					winner = {
						username: user.username,
						avatarUrl: user.displayAvatarURL({ size: 512 })
					}
				}
			}

			return response.json({
				organizer: {
					username: organizer.username,
					avatarUrl: organizer.displayAvatarURL({ size: 512 })
				},
				tournament: tournament.toJSON(),
				winner,
			})
		}
	}
}