import { methods, Route, type ApiRequest, type ApiResponse } from '@sapphire/plugin-api';
import { GetCategoryFromGuild, GetTournamentById } from '../helper-functions/index.js';
import { Tournament } from '../sequelize/Tournaments.js';
import { Snowflake } from 'discord.js';

type PartialTournament = Pick<Tournament,
	"checked_in" | "players" |
	"max_players" | "game" | "description" |
	"country_lock" | "rank_cap" | "winner_id"
	| "name" | "status"> & {
		category: string | null
	}

type Organizer = {
	username: string
	avatarUrl: string
}

type PartialGuild = {
	name: string
	id: Snowflake
	icon: string | null
}

interface Winner extends Organizer { }

type APITournamentResponse = {
	organizer: Organizer
	winner: Winner | null
	tournament: PartialTournament
	/** In the case the bot left the guild and there is no longer information about it. */
	guild: PartialGuild | null
}

export class TournamentInformation extends Route {
	public constructor(context: Route.LoaderContext, options: Route.Options) {
		super(context, {
			...options,
			route: 'tournaments',
		});
	}

	public async [methods.GET](_request: ApiRequest, response: ApiResponse) {


		const _id = new URL(_request.url!, `http://${_request.headers.host}`).searchParams.get('id');

		if (!_id) return response.badRequest({ message: "You have to specify a valid tournament id. ?id=2" })


		const id = parseInt(_id)

		if (isNaN(id)) return response.badRequest({ message: "Parameter 'id' should be a valid number." })

		const tournament = await GetTournamentById(id);

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

			const {
				category, checked_in, country_lock,
				description, game, max_players,
				players, rank_cap, winner_id, name, status
			} = tournament;

			let categoryName = null

			if (category) {
				// Look for the category name
				const _categoryInfo = await GetCategoryFromGuild(category, tournament.guild_id)
				if (_categoryInfo)
					categoryName = _categoryInfo.name
				else // We just use the uuidv4 of this category (probably deleted)
					categoryName = null
			}

			const guild = this.container.client.guilds.cache.get(tournament.guild_id) ?? null

			const _response: APITournamentResponse = {
				organizer: {
					avatarUrl: organizer.displayAvatarURL({ size: 512 }),
					username: `${organizer.username}`,
				},
				winner,
				tournament: {
					category: categoryName,
					checked_in,
					country_lock,
					description,
					game,
					max_players,
					players,
					rank_cap,
					winner_id,
					name,
					status
				},
				guild: guild ? {
					icon: guild.iconURL({ size: 512 }),
					id: guild.id,
					name: guild.name
				} : null
			}

			return response.json(_response)
		}

		else {
			return response.notFound({
				message: "This tournament doesn't exist."
			})
		}
	}
}