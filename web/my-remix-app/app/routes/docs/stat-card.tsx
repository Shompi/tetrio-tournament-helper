type Props = {
	title: string,
	value: string | number | boolean
}

export default function StatCard(props: Props) {
	return (
		<div className="min-h-28 min-w-40 rounded-lg border">
			<div className="p-2">
				<p className="text-center text-2xl font-semibold">{props.title}</p>
			</div>
			<div className="p-2 flex justify-center h-full text-center border-t border-slate-800">
				<p className="font-bold text-2xl">{props.value.toString()}</p>
			</div>
		</div>
	)

}