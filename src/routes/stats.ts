import { ApplyOptions } from '@sapphire/decorators';
import { methods, Route, type ApiRequest, type ApiResponse } from '@sapphire/plugin-api';
import { GetTournamentCount } from '../helper-functions/index.js';
import { ApplicationCommandOptionType } from 'discord.js';

@ApplyOptions<Route.Options>({
	route: 'hello-world',
	name: "stats"
})
export class BotStatsRoute extends Route {


	public async [methods.GET](_request: ApiRequest, response: ApiResponse) {

		const client = this.container.client
		const tournamentCount = await GetTournamentCount()
		const commands = await client.application?.commands.fetch() ?? null

		response.json({
			is_ready: client.isReady(),
			username: client.user?.username ?? null,
			display_name: client.user?.displayName ?? null,
			tag: client.user?.tag ?? null,
			avatar: client.user?.displayAvatarURL({ size: 512 }) ?? null,
			uptime: client.uptime,
			average_ping: client.ws.ping,
			hex_color: client.user?.hexAccentColor ?? null,
			flags: client.user?.flags?.toArray() ?? null,
			status: client.user?.presence.status ?? "Unknown",
			stats: {
				guild_count: client.guilds.cache.size,
				user_count: client.users.cache.size,
				tournament_count: tournamentCount,
				emoji_count: client.emojis.cache.size,
				shard_status: client.ws.status,
				verified: client.user?.verified ?? false,
			},
			commands: commands?.map(command => ({
				name: command.name,
				description: command.description,
				options: command.options.map(option => {
					if (option.type === ApplicationCommandOptionType.Subcommand) {

						return {
							is_subcommand: true,
							options: option.options?.map(option => ({
								name: option.name,
								description: option.description,
								type: option.type
							})) ?? null
						}
					}

					return {
						name: option.name,
						description: option.description,
						type: option.type,
					}
				})
			})) ?? null
		});
	}
}
