import { json, type MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import TournamentCard from "./tournament-card";

export const meta: MetaFunction = () => {
	return [
		{ title: "Tournaments Listing" },
	];
};

export async function loader() {
	const data = await fetch("http://localhost:6969/tournament-list").catch(() => null)

	if (data?.status !== 200)
		return json(null)

	const tournaments = await data.json()

	return json(tournaments)
}

export default function TournamentsList() {

	const tournaments = useLoaderData<typeof loader>()

	if (!tournaments) {
		return (
			<div className="flex w-screen h-screen bg-slate-800 p-12">
				<p className="text-4xl font-nexa text-slate-200">Error: The API returned an error for this request. <br />Try again later.</p>
			</div>
		)
	}

	return (
		<section className="flex flex-col items-center justify-center w-screen h-screen">
			{
				tournaments.map(tournament => (
					<div key={tournament.id}>
						<TournamentCard
							name={tournament.name}
							description={tournament.description}
							guild_icon={tournament.guild_icon}
							id={tournament.id}
							max_players={tournament.max_players}
							players={tournament.players}
							key={tournament.id}
						/>
					</div>
				))
			}
		</section>
	)
}