export default function Unavailable() {
	return (
		<div className="flex flex-col justify-center p-8 bg-gradient-to-b from-sky-800 to-sky-950 h-screen">
			<div className="flex flex-col divide-y-2 gap-y-4">
				<p className="py-4 text-5xl font-bold text-slate-200 w-1/2">
					{"This tournament's information is unavailable at this moment."}
				</p>
				<p className="py-4 text-5xl font-bold text-slate-200 w-1/2">
					{"La información de este torneo no está disponible en este momento."}
				</p>
			</div>
		</div>
	)
}