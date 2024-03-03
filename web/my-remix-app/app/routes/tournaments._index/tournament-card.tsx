export type TournamentInfo = {
	id: number,
	name: string,
	description: string,
	guild_icon: string | null,
	players: number,
	max_players: number | null
}

export default function TournamentCard(props: TournamentInfo) {
	return (
		<div className="min-w-[500px]">
			<p className="font-nexa text-xl">{props.name}</p>

		</div>
	)
}