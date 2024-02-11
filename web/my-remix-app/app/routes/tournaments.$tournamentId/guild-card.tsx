type Arguments = {
	name: string
	icon: string | null
	id: string
}

export default function GuildCard(data: Arguments) {
	return (
		<div id="guild-info-container" className="flex flex-row items-center rounded-br-lg text-slate-100 text-2xl font-semibold rounded-l-lg bg-slate-800">
			<img alt="Guild Icon"
				src={data.icon ?? ""}
				height={64}
				width={64}
				className="rounded-lg"
			/>
			<p className="text-center w-full mx-4">{data.name}</p>
		</div>
	)
}