export type StatsAPIResponse = {
	error: boolean,
	message?: string,
	is_ready: boolean,
	username: string | null,
	display_name: string | null,
	tag: string | null,
	avatar: string|null,
	uptime: number | null,
	average_ping: number,
	hex_color: `#${string}` | null,
	/** @link https://discord-api-types.dev/api/discord-api-types-v10/enum/UserFlags */
	flags: string[] | null,
	stats: {
		guild_count: number,
		user_count: number,
		tournament_count: number,
		emoji_count: number,
		// shard_status: unknown,
		verified: boolean,
		member_count: number,
	},
	/** Im too lazy to type this shaiza */
	commands: unknown[]
}