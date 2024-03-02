import { ApplyOptions } from '@sapphire/decorators';
import { methods, Route, type ApiRequest, type ApiResponse } from '@sapphire/plugin-api';
import { GetAllTournaments } from '../helper-functions/index.js';

@ApplyOptions<Route.Options>({
	route: 'tournament-list'
})
export class UserRoute extends Route {
	public async [methods.GET](_request: ApiRequest, response: ApiResponse) {

		const tournaments = await GetAllTournaments()

		response.json(tournaments.map(tournament => ({
			id: tournament.id,
			name: tournament.name,
			description: tournament.description,
			players: tournament.players.length,
			max_players: tournament.max_players,
			guild_icon: this.container.client.guilds.cache.get(tournament.guild_id)?.iconURL({ size: 512 }) ?? null
		})));
		
	}
}
