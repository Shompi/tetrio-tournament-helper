import { MetaFunction, json } from "@remix-run/node";
import { StatsAPIResponse } from "./types";
import { useLoaderData } from "@remix-run/react";
import Header from "../../components/Header";
import Unavailable from "./unavailable";
import BotInfo from "./stats";
import CommandDocs from "./command-docs";

export const meta: MetaFunction = () => {
	return [
		{ title: "Bot Documentation" },
	];
};

export async function loader() {
	const data = await fetch("http://localhost:6969/stats").catch(() => null)

	if (data?.status !== 200)
		return json(null)

	const stats = await data.json() as StatsAPIResponse

	return json(stats)
}

export default function Documentation() {
	const stats = useLoaderData<typeof loader>()

	console.log(stats?.commands)

	return (
		<div className="flex flex-col min-h-screen bg-black">
			<Header />
			<section className="flex flex-col lg:px-12 w-full">
				{
					stats ?
						<main className="flex flex-col">
							<BotInfo
								avatar={stats!.avatar}
								average_ping={stats!.average_ping}
								display_name={stats!.display_name}
								flags={stats!.flags}
								stats={stats!.stats}
								hex_color={stats!.hex_color}
								is_ready={stats!.is_ready}
								username={stats!.username}
								uptime={stats!.uptime}
								tag={stats!.tag}
							/>
							<CommandDocs commands={stats!.commands} />
						</main> : <Unavailable />
				}
			</section>
		</div>
	)
}