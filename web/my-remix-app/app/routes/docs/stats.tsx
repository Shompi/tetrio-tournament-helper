import StatCard from "./stat-card";
import { StatsAPIResponse } from "./types";

export default function BotInfo(props: StatsAPIResponse) {
	return (
		<section id="bot-info" className="flex flex-col items-center text-slate-200 font-nexa mt-12 px-2">
			<div>
				<p className="font-nexaHeavy text-4xl">ESTADISTICAS GENERALES</p>
				<p className="text-slate-400">{new Date().toLocaleString()}</p>
			</div>
			<div id="bot-card" className=" my-10 flex flex-row gap-x-10 divide-x-2 divide-slate-200">
				<img src={props.avatar!} alt="Tournament bot Avatar" height={128} width={128} />
				<div className="flex flex-col text-md text-slate-400 px-4">
					<p className="text-2xl font-nexaHeavy text-slate-200">{props.display_name}</p>
					<p>{props.tag}</p>
					<div id="stats-box" className="flex flex-row gap-x-2 text-slate-200">
						<p><span className="font-semibold">{props.stats.guild_count}</span> Servidores</p>
						<p><span className="font-semibold">{props.stats.tournament_count}</span> Torneos</p>
						<p><span className="font-semibold">{props.stats.user_count}</span> Usuarios</p>
					</div>
				</div>
			</div>
			<div id="other-stats" className="flex flex-row gap-4 flex-wrap">
				<StatCard title={"READY"} value={props.is_ready} />
				<StatCard title={"PING (ms)"} value={props.average_ping} />
			</div>
		</section>
	)
}